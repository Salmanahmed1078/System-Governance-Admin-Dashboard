const { pool } = require('../db');

// GET /api/analytics/clients
async function getClients(req, res) {
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

    const [kpis, topClients, industryVolume, heatmap] = await Promise.all([
      pool.query(`
        WITH jobs_in_range AS (
          SELECT id, client_id, created_at
          FROM jobs
          WHERE created_at >= $1
        ),
        first_hires AS (
          SELECT job_id, MIN(created_at) AS hired_at
          FROM projects
          GROUP BY job_id
        )
        SELECT
          COUNT(DISTINCT j.client_id) AS active_clients,
          COUNT(j.id) AS jobs_posted,
          ROUND(AVG(EXTRACT(EPOCH FROM (fh.hired_at - j.created_at)) / 86400)::numeric, 1) AS avg_time_to_hire_days,
          ROUND(
            COUNT(DISTINCT CASE WHEN jc.job_count > 1 THEN j.client_id END) * 100.0
            / NULLIF(COUNT(DISTINCT j.client_id), 0),
            1
          ) AS repeat_hire_rate
        FROM jobs_in_range j
        LEFT JOIN first_hires fh ON fh.job_id = j.id
        LEFT JOIN (
          SELECT client_id, COUNT(*) AS job_count
          FROM jobs_in_range
          GROUP BY client_id
        ) jc ON jc.client_id = j.client_id`, [rangeStart]),
      pool.query(`
        WITH jobs_in_range AS (
          SELECT client_id, COUNT(*) AS jobs_posted
          FROM jobs
          WHERE created_at >= $1
          GROUP BY client_id
        ),
        projects_in_range AS (
          SELECT client_id,
                 COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) AS projects_active,
                 COALESCE(SUM(agreed_amount), 0)::numeric(18,2) AS total_spend
          FROM projects
          WHERE created_at >= $1
          GROUP BY client_id
        )
        SELECT
          u.first_name || ' ' || u.last_name AS name,
          u.country,
          j.jobs_posted,
          COALESCE(p.projects_active, 0) AS projects_active,
          COALESCE(p.total_spend, 0)::numeric(18,2) AS total_spend
        FROM users u
        JOIN jobs_in_range j ON j.client_id = u.id
        LEFT JOIN projects_in_range p ON p.client_id = u.id
        WHERE u.role = 'client'
        GROUP BY u.id, u.first_name, u.last_name, u.country, j.jobs_posted, p.projects_active, p.total_spend
        ORDER BY jobs_posted DESC
        LIMIT 10`, [rangeStart]),
      pool.query(`
        SELECT
          mc.name AS category,
          COUNT(j.id) AS job_count,
          ROUND(AVG(j.budget_max), 0) AS avg_budget
        FROM jobs j
        JOIN marketplace_categories mc ON mc.id = j.category_id
        WHERE j.created_at >= $1
        GROUP BY mc.name
        ORDER BY job_count DESC`, [rangeStart]),
      pool.query(`
        SELECT
          EXTRACT(DOW FROM j.created_at)::int AS day_of_week,
          EXTRACT(HOUR FROM j.created_at)::int AS hour_of_day,
          COUNT(*) AS count
        FROM jobs j
        WHERE j.created_at >= $1
        GROUP BY day_of_week, hour_of_day`, [rangeStart]),
    ]);

    res.json({
      range,
      kpis: {
        activeClients: parseInt(kpis.rows[0]?.active_clients || 0),
        jobsPosted: parseInt(kpis.rows[0]?.jobs_posted || 0),
        avgTimeToHire: parseFloat(kpis.rows[0]?.avg_time_to_hire_days || 0),
        repeatHireRate: parseFloat(kpis.rows[0]?.repeat_hire_rate || 0),
      },
      topClients: topClients.rows,
      industryVolume: industryVolume.rows,
      heatmap: heatmap.rows,
    });
  } catch (err) {
    console.error('Clients analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch client analytics' });
  }
}

module.exports = { getClients };
