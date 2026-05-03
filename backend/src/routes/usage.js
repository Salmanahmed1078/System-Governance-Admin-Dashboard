const net = require('net');
const { pool } = require('../db');

// GET /api/system/usage
async function getUsage(req, res) {
  try {
    const range = ['7d', '30d', 'ytd'].includes(req.query.range) ? req.query.range : '30d';
    const now = new Date();
    const rangeStart = new Date(now);
    if (range === '7d') {
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (range === '30d') {
      rangeStart.setDate(rangeStart.getDate() - 29);
    } else {
      rangeStart.setMonth(0, 1);
    }
    rangeStart.setHours(0, 0, 0, 0);

    const pageViewExpr = `lower(trim(COALESCE(action, ''))) = 'page_view'`;

    const [kpis, traffic, devices, browsers] = await Promise.all([
      pool.query(
        `
        WITH base AS (
          SELECT * FROM m9_analytics_logs
          WHERE log_timestamp >= $1
        ),
        session_agg AS (
          SELECT
            session_id,
            COUNT(*) AS evt_count,
            COUNT(*) FILTER (WHERE ${pageViewExpr}) AS pv_count,
            SUM(COALESCE((metadata->>'duration_ms')::numeric, 0)) AS sum_dwell_ms,
            EXTRACT(EPOCH FROM (MAX(log_timestamp) - MIN(log_timestamp))) AS span_sec
          FROM base
          GROUP BY session_id
        )
        SELECT
          COUNT(*) AS total_sessions,
          COALESCE(ROUND(AVG(
            CASE
              WHEN sum_dwell_ms > 0 THEN sum_dwell_ms / 1000.0
              ELSE COALESCE(span_sec, 0)
            END
          ), 1), 0) AS avg_session_duration_sec,
          (SELECT COUNT(*) FROM base WHERE ${pageViewExpr}) AS total_page_views,
          COALESCE(ROUND(
            100.0 * COUNT(*) FILTER (
              WHERE pv_count >= 1
                AND pv_count = 1
                AND evt_count = 1
                AND COALESCE(sum_dwell_ms, 0) < 5000
            ) / NULLIF(COUNT(*) FILTER (WHERE pv_count >= 1), 0),
            1
          ), 0) AS bounce_rate
        FROM session_agg`,
        [rangeStart]
      ),
      pool.query(`
        WITH buckets AS (
          SELECT
            DATE_TRUNC(
              CASE
                WHEN $2 = '7d' THEN 'day'
                WHEN $2 = '30d' THEN 'week'
                ELSE 'month'
              END,
              log_timestamp
            ) AS bucket_date,
            role_flag
          FROM m9_analytics_logs
          WHERE log_timestamp >= $1
            AND lower(trim(COALESCE(action, ''))) = 'page_view'
        )
        SELECT
          TO_CHAR(
            bucket_date,
            CASE
              WHEN $2 = '7d' THEN 'DD Mon'
              WHEN $2 = '30d' THEN '"Wk" IW'
              ELSE 'Mon'
            END
          ) AS day,
          bucket_date AS day_date,
          COUNT(CASE WHEN role_flag = 'admin' OR role_flag = 'moderator' THEN 1 END) AS internal,
          COUNT(CASE WHEN role_flag = 'analyst' THEN 1 END) AS external
        FROM buckets
        GROUP BY bucket_date ORDER BY bucket_date ASC`, [rangeStart, range]),
      pool.query(`
        SELECT
          metadata->>'device' AS device,
          COUNT(*) AS count
        FROM m9_analytics_logs
        WHERE NULLIF(trim(metadata->>'device'), '') IS NOT NULL
          AND log_timestamp >= $1
          AND lower(trim(COALESCE(action, ''))) = 'page_view'
        GROUP BY device ORDER BY count DESC`, [rangeStart]),
      pool.query(`
        SELECT
          metadata->>'browser' AS browser,
          COUNT(*) AS count
        FROM m9_analytics_logs
        WHERE NULLIF(trim(metadata->>'browser'), '') IS NOT NULL
          AND log_timestamp >= $1
          AND lower(trim(COALESCE(action, ''))) = 'page_view'
        GROUP BY browser ORDER BY count DESC`, [rangeStart]),
    ]);

    res.json({
      range,
      kpis: {
        totalSessions: parseInt(kpis.rows[0]?.total_sessions || 0),
        avgSessionDuration: parseFloat(kpis.rows[0]?.avg_session_duration_sec || 0),
        pageViews: parseInt(kpis.rows[0]?.total_page_views || 0),
        bounceRate: parseFloat(kpis.rows[0]?.bounce_rate || 0),
      },
      traffic: traffic.rows,
      devices: devices.rows,
      browsers: browsers.rows,
    });
  } catch (err) {
    console.error('Usage analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
}

function pgInetOrNull(ip) {
  if (ip == null) return null;
  const s = String(ip).trim();
  if (!s) return null;
  const noZone = s.split('%')[0].replace(/^::ffff:/i, '');
  return net.isIP(noZone) ? noZone : null;
}

// POST /api/system/track
async function trackUsageEvent(req, res) {
  try {
    const body = req.body || {};
    const actionRaw = String(body.action || 'page_view').trim().toLowerCase();
    const action = actionRaw || 'page_view';
    const page = body.page ? String(body.page).slice(0, 200) : null;
    const device = body.device ? String(body.device).slice(0, 40) : null;
    const browser = body.browser ? String(body.browser).slice(0, 40) : null;
    const durationMs = Number.isFinite(Number(body.durationMs)) ? Math.max(0, Math.round(Number(body.durationMs))) : null;
    const sessionId = body.sessionId ? String(body.sessionId).slice(0, 100) : null;

    const rawHeader = req.headers['x-admin-user-id'];
    const adminId = rawHeader != null && String(rawHeader).trim() !== '' ? parseInt(String(rawHeader).trim(), 10) : null;

    let actor = null;
    if (adminId != null && !Number.isNaN(adminId)) {
      const q = await pool.query(
        `SELECT id, role::text AS role FROM users WHERE id = $1 AND role IN ('admin','moderator') LIMIT 1`,
        [adminId]
      );
      actor = q.rows[0] || null;
    }

    const roleFlag = actor?.role || 'analyst';
    const userId = actor?.id || null;

    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || req.socket?.remoteAddress || null);
    const ipInet = pgInetOrNull(rawIp);

    const metadata = {
      page,
      device,
      browser,
      duration_ms: durationMs,
    };

    await pool.query(
      `INSERT INTO m9_analytics_logs (session_id, user_id, role_flag, action, metadata, ip_address, user_agent, log_timestamp)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::inet, $7, NOW())`,
      [sessionId, userId, roleFlag, action, JSON.stringify(metadata), ipInet, req.get('user-agent') || null]
    );

    return res.status(204).send();
  } catch (err) {
    console.error('Usage track error:', err);
    return res.status(500).json({ error: 'Failed to record usage event' });
  }
}

module.exports = { getUsage, trackUsageEvent };
