const net = require('net');
const { pool } = require('../db');
const { generateCsv, generatePdf } = require('../services/exportService');

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return raw || req.ip || req.socket?.remoteAddress || null;
}

/** PostgreSQL inet rejects some strings Node exposes (e.g. IPv6 zone). */
function pgInetOrNull(ip) {
  if (ip == null) return null;
  const s = String(ip).trim();
  if (!s) return null;
  const noZone = s.split('%')[0];
  return net.isIP(noZone) ? noZone : null;
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Exclusive interval end so calendar "to" date includes the whole last day ([from, to] inclusive). */
function exclusiveUpperBoundInclusiveToDate(endDate) {
  if (!endDate || !(endDate instanceof Date)) return null;
  const x = new Date(endDate.getTime());
  x.setUTCDate(x.getUTCDate() + 1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const tld = domain.includes('.') ? domain.split('.').pop() : '***';
  return `${(local[0] || '*')}***@***.${tld}`;
}

function maskIp(ip) {
  if (!ip || typeof ip !== 'string') return ip;
  let s = ip.trim();
  if (!s) return s;
  s = s.split('%')[0];
  if (/^::ffff:/i.test(s)) s = s.replace(/^::ffff:/i, '');
  s = s.replace(/\/\d+$/, '');
  const parts = s.split('.');
  const octetsOk =
    parts.length === 4 &&
    parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
  if (octetsOk) return `${parts[0]}.${parts[1]}.x.x`;
  return '[redacted]';
}

function maskRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (k === 'email') out[k] = maskEmail(v);
    else if (k === 'ip_address' || k === 'ip') out[k] = maskIp(v);
    else out[k] = v;
  }
  return out;
}

/** Prefer gateway header validated against centralized users; else first admin row. */
async function resolveExportActor(req) {
  const raw = req.headers['x-admin-user-id'];
  if (raw != null && String(raw).trim() !== '') {
    const hid = parseInt(String(raw).trim(), 10);
    if (!Number.isNaN(hid)) {
      const v = await pool.query(
        `SELECT id, role::text AS role_flag FROM users WHERE id = $1 AND role IN ('admin', 'moderator') LIMIT 1`,
        [hid]
      );
      if (v.rows[0]) return { id: v.rows[0].id, role_flag: v.rows[0].role_flag };
    }
  }
  const fallback = await pool.query(
    `SELECT id, role::text AS role_flag FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`
  );
  if (fallback.rows[0]) return { id: fallback.rows[0].id, role_flag: fallback.rows[0].role_flag };
  return null;
}

// POST /api/exports/generate
async function generateExport(req, res) {
  const { format = 'CSV', type = 'freelancer_analytics', dateRange = '30d', filters = {} } = req.body;
  const fromDate = parseDateOrNull(filters?.fromDate);
  const toDate = parseDateOrNull(filters?.toDate);
  const toDateExclusive = exclusiveUpperBoundInclusiveToDate(toDate);
  const hasDateWindow = fromDate && toDateExclusive;

  if (!['CSV', 'PDF'].includes(format.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid format. Use CSV or PDF.' });
  }

  try {
    // Fetch data based on type
    let data = [];
    let headers = [];

    switch (type) {
      case 'freelancer_analytics': {
        // Same fact basis as GET /api/analytics/freelancers leaderboard (projects + reviews in window), not gamification signup slice.
        const windowParams = hasDateWindow ? [fromDate, toDateExclusive] : [];

        const fl = hasDateWindow
          ? await pool.query(
              `
          WITH project_stats AS (
            SELECT
              p.freelancer_id,
              COUNT(*) AS total_projects,
              COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects
            FROM projects p
            WHERE p.created_at >= $1 AND p.created_at < $2
            GROUP BY p.freelancer_id
          ),
          review_stats AS (
            SELECT
              r.freelancer_id,
              AVG(r.rating) AS avg_rating
            FROM reviews r
            WHERE r.created_at >= $1 AND r.created_at < $2
            GROUP BY r.freelancer_id
          )
          SELECT
            ROW_NUMBER() OVER (
              ORDER BY
                COALESCE(rs.avg_rating, 0) DESC,
                COALESCE(ps.completed_projects * 100.0 / NULLIF(ps.total_projects, 0), 0) DESC
            ) AS rank,
            'FL-' || LPAD(u.id::text, 4, '0') AS freelancer_id,
            u.first_name || ' ' || u.last_name AS name,
            u.country,
            COALESCE(ps.total_projects, 0) AS projects,
            ROUND(COALESCE(rs.avg_rating, 0)::numeric, 2) AS rating,
            ROUND(
              COALESCE(
                ps.completed_projects * 100.0 / NULLIF(ps.total_projects, 0),
                0
              )::numeric,
              1
            ) AS completion_rate,
            pr.tier_level
          FROM users u
          LEFT JOIN profiles pr ON pr.user_id = u.id
          LEFT JOIN project_stats ps ON ps.freelancer_id = u.id
          LEFT JOIN review_stats rs ON rs.freelancer_id = u.id
          WHERE u.role = 'freelancer' AND u.account_status = 'active'
          AND (COALESCE(ps.total_projects, 0) > 0 OR rs.avg_rating IS NOT NULL)
          ORDER BY rating DESC NULLS LAST, completion_rate DESC
          LIMIT 100`,
              windowParams
            )
          : await pool.query(`
          WITH project_stats AS (
            SELECT
              p.freelancer_id,
              COUNT(*) AS total_projects,
              COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects
            FROM projects p
            WHERE p.created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
            GROUP BY p.freelancer_id
          ),
          review_stats AS (
            SELECT
              r.freelancer_id,
              AVG(r.rating) AS avg_rating
            FROM reviews r
            WHERE r.created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
            GROUP BY r.freelancer_id
          )
          SELECT
            ROW_NUMBER() OVER (
              ORDER BY
                COALESCE(rs.avg_rating, 0) DESC,
                COALESCE(ps.completed_projects * 100.0 / NULLIF(ps.total_projects, 0), 0) DESC
            ) AS rank,
            'FL-' || LPAD(u.id::text, 4, '0') AS freelancer_id,
            u.first_name || ' ' || u.last_name AS name,
            u.country,
            COALESCE(ps.total_projects, 0) AS projects,
            ROUND(COALESCE(rs.avg_rating, 0)::numeric, 2) AS rating,
            ROUND(
              COALESCE(
                ps.completed_projects * 100.0 / NULLIF(ps.total_projects, 0),
                0
              )::numeric,
              1
            ) AS completion_rate,
            pr.tier_level
          FROM users u
          LEFT JOIN profiles pr ON pr.user_id = u.id
          LEFT JOIN project_stats ps ON ps.freelancer_id = u.id
          LEFT JOIN review_stats rs ON rs.freelancer_id = u.id
          WHERE u.role = 'freelancer' AND u.account_status = 'active'
          AND (COALESCE(ps.total_projects, 0) > 0 OR rs.avg_rating IS NOT NULL)
          ORDER BY rating DESC NULLS LAST, completion_rate DESC
          LIMIT 100`);
        data = fl.rows;
        headers = ['rank', 'freelancer_id', 'name', 'country', 'projects', 'rating', 'completion_rate', 'tier_level'];
        break;
      }
      case 'client_statistics':
        const cl = hasDateWindow ? await pool.query(`
          SELECT u.first_name||' '||u.last_name AS name, u.country,
            COUNT(j.id) AS jobs_posted, COALESCE(SUM(p.agreed_amount),0) AS total_spend
          FROM users u LEFT JOIN jobs j ON j.client_id=u.id AND j.created_at >= $1 AND j.created_at < $2
          LEFT JOIN projects p ON p.client_id=u.id AND p.created_at >= $1 AND p.created_at < $2
          WHERE u.role='client' GROUP BY u.id,u.first_name,u.last_name,u.country LIMIT 100`, [fromDate, toDateExclusive]) : await pool.query(`
          SELECT u.first_name||' '||u.last_name AS name, u.country,
            COUNT(j.id) AS jobs_posted, COALESCE(SUM(p.agreed_amount),0) AS total_spend
          FROM users u LEFT JOIN jobs j ON j.client_id=u.id
          LEFT JOIN projects p ON p.client_id=u.id
          WHERE u.role='client' GROUP BY u.id,u.first_name,u.last_name,u.country LIMIT 100`);
        data = cl.rows;
        headers = ['name','country','jobs_posted','total_spend'];
        break;
      case 'skill_trends':
        const sk = hasDateWindow ? await pool.query(`
          SELECT s.skill_name, s.category, COUNT(jrs.id) AS demand_count
          FROM skills s LEFT JOIN job_required_skills jrs ON jrs.skill_id=s.id AND jrs.created_at >= $1 AND jrs.created_at < $2
          GROUP BY s.id,s.skill_name,s.category ORDER BY demand_count DESC LIMIT 50`, [fromDate, toDateExclusive]) : await pool.query(`
          SELECT s.skill_name, s.category, COUNT(jrs.id) AS demand_count
          FROM skills s LEFT JOIN job_required_skills jrs ON jrs.skill_id=s.id
          GROUP BY s.id,s.skill_name,s.category ORDER BY demand_count DESC LIMIT 50`);
        data = sk.rows;
        headers = ['skill_name','category','demand_count'];
        break;
      case 'audit_log':
        const audit = hasDateWindow ? await pool.query(`
          SELECT log_id, session_id, role_flag, action, ip_address::text AS ip_address,
                 log_timestamp
          FROM m9_analytics_logs
          WHERE log_timestamp >= $1 AND log_timestamp < $2
          ORDER BY log_timestamp DESC
          LIMIT 500`, [fromDate, toDateExclusive]) : await pool.query(`
          SELECT log_id, session_id, role_flag, action, ip_address::text AS ip_address,
                 log_timestamp
          FROM m9_analytics_logs
          ORDER BY log_timestamp DESC
          LIMIT 500`);
        data = audit.rows;
        headers = ['log_id','session_id','role_flag','action','ip_address','log_timestamp'];
        break;
      case 'usage_report':
        const usage = hasDateWindow ? await pool.query(`
          SELECT session_id, role_flag, action,
                 metadata->>'device' AS device,
                 metadata->>'browser' AS browser,
                 metadata->>'duration_ms' AS duration_ms,
                 ip_address::text AS ip_address,
                 log_timestamp
          FROM m9_analytics_logs
          WHERE log_timestamp >= $1 AND log_timestamp < $2
          ORDER BY log_timestamp DESC
          LIMIT 1000`, [fromDate, toDateExclusive]) : await pool.query(`
          SELECT session_id, role_flag, action,
                 metadata->>'device' AS device,
                 metadata->>'browser' AS browser,
                 metadata->>'duration_ms' AS duration_ms,
                 ip_address::text AS ip_address,
                 log_timestamp
          FROM m9_analytics_logs
          ORDER BY log_timestamp DESC
          LIMIT 1000`);
        data = usage.rows;
        headers = ['session_id','role_flag','action','device','browser','duration_ms','ip_address','log_timestamp'];
        break;
      case 'platform_kpis':
      default:
        const kpi = hasDateWindow ? await pool.query(`
          SELECT snapshot_date, total_users, active_freelancers, active_clients, total_projects,
                 completed_projects, disputed_projects, total_transaction_volume, platform_revenue,
                 avg_project_completion_days, avg_rating, certifications_issued, active_gigs
          FROM m9_kpi_snapshots
          WHERE snapshot_date >= $1::date AND snapshot_date < $2::timestamp::date
          ORDER BY snapshot_date DESC
          LIMIT 365`, [fromDate, toDateExclusive]) : await pool.query(`
          SELECT snapshot_date, total_users, active_freelancers, active_clients, total_projects,
                 completed_projects, disputed_projects, total_transaction_volume, platform_revenue,
                 avg_project_completion_days, avg_rating, certifications_issued, active_gigs
          FROM m9_kpi_snapshots ORDER BY snapshot_date DESC LIMIT 30`);
        data = kpi.rows;
        headers = Object.keys(kpi.rows[0] || {});
    }

    data = data.map(maskRow);

    // Generate file
    let fileBuffer, contentType, filename;
    if (format.toUpperCase() === 'CSV') {
      fileBuffer = await generateCsv(data, headers);
      contentType = 'text/csv';
      filename = `m9_${type}_${Date.now()}.csv`;
    } else {
      fileBuffer = await generatePdf(data, headers, type);
      contentType = 'application/pdf';
      filename = `m9_${type}_${Date.now()}.pdf`;
    }

    const actor = await resolveExportActor(req);
    if (!actor) {
      return res.status(409).json({
        error:
          'Cannot export: add an admin user to the centralized users table, or call with header x-admin-user-id set to a valid admin/moderator user id.',
      });
    }

    await pool.query(`
      INSERT INTO m9_export_records (admin_id, format, export_type, filters_applied, row_count, file_size_bytes, file_url, generated_at, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW() + INTERVAL '7 days')`,
      [
        actor.id,
        format.toUpperCase(),
        type,
        JSON.stringify({ dateRange, ...filters }),
        data.length,
        fileBuffer.length,
        `/exports/${filename}`
      ]
    );

    const rawIp = clientIp(req);
    const ipInet = pgInetOrNull(rawIp);
    const sessionHeader = req.headers['x-session-id'];
    const sessionId = typeof sessionHeader === 'string' && sessionHeader.trim() ? sessionHeader.trim() : null;
    const metadataObj = {
      page: '/reports',
      export_type: type,
      format: format.toUpperCase(),
      row_count: data.length,
      file: filename,
      client_ip: rawIp || null,
    };
    try {
      await pool.query(
        `INSERT INTO m9_analytics_logs (session_id, user_id, role_flag, action, metadata, ip_address, user_agent, log_timestamp)
         VALUES ($1, $2, $3, 'export_triggered', $4::jsonb, $5::inet, $6, NOW())`,
        [
          sessionId,
          actor.id,
          actor.role_flag,
          JSON.stringify(metadataObj),
          ipInet,
          req.get('user-agent') || null,
        ]
      );
      res.setHeader('X-M9-Audit-Log', 'written');
    } catch (logErr) {
      console.error('Failed to write export audit log:', logErr);
      res.setHeader('X-M9-Audit-Log', 'failed');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to generate export' });
  }
}

// GET /api/exports/history
async function getHistory(req, res) {
  try {
    const rows = await pool.query(`
      SELECT export_id, format, export_type, filters_applied, row_count,
             file_size_bytes, file_url,
             generated_at,
             expires_at
      FROM m9_export_records ORDER BY generated_at DESC LIMIT 20`);
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch export history' });
  }
}

module.exports = { generateExport, getHistory };
