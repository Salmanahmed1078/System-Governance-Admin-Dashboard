const { pool } = require('../db');

// GET /api/kpis/overview
async function getOverview(req, res) {
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

    const [
      freelancers,
      hireRate,
      verifications,
      uptime,
      usageKpi,
      trend,
      topSkills,
      qualityDist,
      dataFreshness,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'freelancer' AND account_status = 'active'`),
      pool.query(`
        SELECT 
          ROUND(
            COUNT(CASE WHEN j.status IN ('in_progress','completed') THEN 1 END) * 100.0 
            / NULLIF(COUNT(*), 0), 1
          ) AS rate
        FROM jobs j
        WHERE j.created_at >= $1`, [rangeStart]),
      pool.query(`
        SELECT COUNT(*) AS count
        FROM verification_requests
        WHERE verification_status = 'verified'
          AND requested_at >= $1`, [rangeStart]),
      pool.query(`
        WITH base AS (
          SELECT lower(trim(COALESCE(action, ''))) AS action
          FROM m9_analytics_logs
          WHERE log_timestamp >= $1
        ),
        agg AS (
          SELECT
            COUNT(*)::numeric AS total_events,
            COUNT(*) FILTER (
              WHERE action LIKE '%fail%'
                OR action LIKE '%error%'
                OR action LIKE '%denied%'
            )::numeric AS error_events
          FROM base
        )
        SELECT CASE
          WHEN total_events = 0 THEN NULL
          ELSE ROUND((100 - (error_events * 100.0 / total_events))::numeric, 2)
        END AS uptime_pct
        FROM agg`, [rangeStart]),
      pool.query(`
        SELECT COUNT(DISTINCT session_id) AS total_sessions
        FROM m9_analytics_logs
        WHERE log_timestamp >= $1`, [rangeStart]),
      pool.query(`
        WITH days AS (
          SELECT generate_series(
            $1::date,
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS day
        ),
        postings AS (
          SELECT DATE(created_at) AS day, COUNT(*) AS total_projects
          FROM jobs
          WHERE created_at >= $1
          GROUP BY DATE(created_at)
        ),
        bids_received AS (
          SELECT DATE(submitted_at) AS day, COUNT(*) AS total_bids
          FROM bids
          WHERE submitted_at >= $1
          GROUP BY DATE(submitted_at)
        )
        SELECT
          TO_CHAR(d.day, 'YYYY-MM-DD') AS snapshot_date,
          COALESCE(p.total_projects, 0) AS total_projects,
          COALESCE(b.total_bids, 0) AS total_bids
        FROM days d
        LEFT JOIN postings p ON p.day = d.day
        LEFT JOIN bids_received b ON b.day = d.day
        ORDER BY d.day ASC`, [rangeStart]),
      pool.query(`
        WITH scoped AS (
          SELECT s.skill_name AS skill
          FROM job_required_skills jrs
          INNER JOIN jobs j ON j.id = jrs.job_id
          INNER JOIN skills s ON s.id = jrs.skill_id
          WHERE j.created_at >= $1
        ),
        tot AS (
          SELECT COUNT(*)::numeric AS cnt FROM scoped
        )
        SELECT skill, ROUND(COUNT(*) * 100.0 / NULLIF((SELECT cnt FROM tot), 0), 0) AS pct
        FROM scoped
        GROUP BY skill
        ORDER BY COUNT(*) DESC
        LIMIT 5`, [rangeStart]),
      pool.query(`
        SELECT rating, COUNT(*) as count 
        FROM reviews 
        WHERE created_at >= $1
        GROUP BY rating 
        ORDER BY rating DESC`, [rangeStart]),
      pool.query(
        `
        WITH recent AS (
          SELECT MAX(ts) AS v FROM (
            SELECT MAX(created_at) AS ts
            FROM m9_kpi_snapshots
            WHERE snapshot_date >= ($1)::date
              AND created_at >= ($1)::timestamptz
              AND created_at <= CURRENT_TIMESTAMP
            UNION ALL
            SELECT MAX(created_at) AS ts
            FROM jobs
            WHERE created_at >= ($1)::timestamptz AND created_at <= CURRENT_TIMESTAMP
            UNION ALL
            SELECT MAX(submitted_at) AS ts
            FROM bids
            WHERE submitted_at >= ($1)::timestamptz AND submitted_at <= CURRENT_TIMESTAMP
            UNION ALL
            SELECT MAX(created_at) AS ts
            FROM reviews
            WHERE created_at >= ($1)::timestamptz AND created_at <= CURRENT_TIMESTAMP
            UNION ALL
            SELECT MAX(log_timestamp) AS ts
            FROM m9_analytics_logs
            WHERE log_timestamp >= ($1)::timestamptz AND log_timestamp <= CURRENT_TIMESTAMP
          ) x
        )
        SELECT COALESCE((SELECT v FROM recent), CURRENT_TIMESTAMP) AS last_updated`,
        [rangeStart]
      ),
    ]);

    const freshness = dataFreshness.rows[0];
    /** ISO string for browsers; excludes future timestamps (see SQL cap at CURRENT_TIMESTAMP) */
    const lastUpdatedIso =
      freshness?.last_updated instanceof Date ? freshness.last_updated.toISOString() : freshness?.last_updated;

    res.json({
      range,
      asOf: new Date().toISOString(),
      activeFreelancers: parseInt(freelancers.rows[0]?.count || 0),
      clientHireRate: parseFloat(hireRate.rows[0]?.rate || 0),
      skillVerifications: parseInt(verifications.rows[0]?.count || 0),
      platformUptime:
        uptime.rows[0]?.uptime_pct != null && uptime.rows[0].uptime_pct !== ''
          ? parseFloat(uptime.rows[0].uptime_pct)
          : null,
      totalSessions: parseInt(usageKpi.rows[0]?.total_sessions || 0),
      lastUpdated: lastUpdatedIso || null,
      trend: trend.rows || [],
      topSkills: topSkills.rows || [],
      qualityDistribution: qualityDist.rows || []
    });
  } catch (err) {
    console.error('KPI overview error:', err);
    res.status(500).json({ error: 'Failed to fetch KPI overview' });
  }
}

module.exports = { getOverview };
