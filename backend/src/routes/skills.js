const { pool } = require('../db');

// GET /api/analytics/skills
async function getSkills(req, res) {
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

    const periodMs = now.getTime() - rangeStart.getTime();
    const previousStart = new Date(rangeStart.getTime() - periodMs);

    const [demand, categories, rising, topSkill, trend] = await Promise.all([
      pool.query(`
        WITH demand_counts AS (
          SELECT skill_id, COUNT(*)::int AS demand_count
          FROM job_required_skills
          WHERE created_at >= $1
          GROUP BY skill_id
        ),
        supply_counts AS (
          SELECT skill_id, COUNT(*)::int AS supply_count
          FROM user_skills
          GROUP BY skill_id
        ),
        total_demand AS (
          SELECT COUNT(*)::int AS total_count
          FROM job_required_skills
          WHERE created_at >= $1
        )
        SELECT
          s.skill_name,
          s.category,
          COALESCE(dc.demand_count, 0) AS demand_count,
          COALESCE(sc.supply_count, 0) AS supply_count,
          ROUND(
            COALESCE(dc.demand_count, 0) * 100.0 / NULLIF(
              (SELECT total_count FROM total_demand),
              0
            ),
            1
          ) AS demand_pct
        FROM skills s
        LEFT JOIN demand_counts dc ON dc.skill_id = s.id
        LEFT JOIN supply_counts sc ON sc.skill_id = s.id
        WHERE s.is_active = true
        GROUP BY s.id, s.skill_name, s.category, dc.demand_count, sc.supply_count
        ORDER BY demand_count DESC
        LIMIT 15`, [rangeStart]),
      pool.query(`
        SELECT
          s.category,
          COUNT(jrs.id) AS count
        FROM skills s
        JOIN job_required_skills jrs ON jrs.skill_id = s.id
        WHERE s.category IS NOT NULL
          AND jrs.created_at >= $1
        GROUP BY s.category
        ORDER BY count DESC`, [rangeStart]),
      pool.query(`
        WITH current_period AS (
          SELECT skill_id, COUNT(*)::int AS this_period
          FROM job_required_skills
          WHERE created_at >= $1
          GROUP BY skill_id
        ),
        previous_period AS (
          SELECT skill_id, COUNT(*)::int AS previous_period
          FROM job_required_skills
          WHERE created_at >= $2 AND created_at < $1
          GROUP BY skill_id
        )
        SELECT
          s.skill_name,
          s.category,
          COALESCE(c.this_period, 0) AS this_month,
          COALESCE(p.previous_period, 0) AS last_month,
          ROUND(
            COALESCE(
              (COALESCE(c.this_period, 0) - COALESCE(p.previous_period, 0)) * 100.0
              / NULLIF(COALESCE(p.previous_period, 0), 0),
              CASE WHEN COALESCE(c.this_period, 0) > 0 THEN 100 ELSE 0 END
            )::numeric,
            1
          ) AS mom_change_pct
        FROM skills s
        LEFT JOIN current_period c ON c.skill_id = s.id
        LEFT JOIN previous_period p ON p.skill_id = s.id
        WHERE COALESCE(c.this_period, 0) > 0
        ORDER BY this_month DESC
        LIMIT 10`, [rangeStart, previousStart]),
      pool.query(`
        SELECT s.skill_name, COUNT(jrs.id) AS demand_count,
               ROUND(COUNT(jrs.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM job_required_skills WHERE created_at >= $1), 0), 1) AS demand_pct
        FROM skills s
        JOIN job_required_skills jrs ON jrs.skill_id = s.id
        WHERE jrs.created_at >= $1
        GROUP BY s.id, s.skill_name
        ORDER BY demand_count DESC
        LIMIT 1`, [rangeStart]),
      pool.query(`
        WITH top_skills AS (
          SELECT s.id, s.skill_name
          FROM skills s
          JOIN job_required_skills jrs ON jrs.skill_id = s.id
          WHERE jrs.created_at >= $1
          GROUP BY s.id, s.skill_name
          ORDER BY COUNT(jrs.id) DESC
          LIMIT 5
        ),
        periods AS (
          SELECT generate_series(
            DATE_TRUNC(CASE WHEN $2 = '7d' THEN 'day' WHEN $2 = '30d' THEN 'week' ELSE 'month' END, $1::timestamp),
            DATE_TRUNC(CASE WHEN $2 = '7d' THEN 'day' WHEN $2 = '30d' THEN 'week' ELSE 'month' END, NOW()),
            CASE WHEN $2 = '7d' THEN INTERVAL '1 day' WHEN $2 = '30d' THEN INTERVAL '1 week' ELSE INTERVAL '1 month' END
          ) AS period_start
        ),
        counts AS (
          SELECT
            DATE_TRUNC(CASE WHEN $2 = '7d' THEN 'day' WHEN $2 = '30d' THEN 'week' ELSE 'month' END, jrs.created_at) AS period_start,
            jrs.skill_id,
            COUNT(*)::int AS demand_count
          FROM job_required_skills jrs
          WHERE jrs.created_at >= $1
          GROUP BY 1, 2
        )
        SELECT
          TO_CHAR(
            p.period_start,
            CASE WHEN $2 = '7d' THEN 'DD Mon' WHEN $2 = '30d' THEN '"Wk" IW' ELSE 'Mon' END
          ) AS period_label,
          ts.skill_name,
          COALESCE(c.demand_count, 0) AS demand_count
        FROM periods p
        CROSS JOIN top_skills ts
        LEFT JOIN counts c ON c.period_start = p.period_start AND c.skill_id = ts.id
        ORDER BY p.period_start ASC, ts.skill_name ASC`, [rangeStart, range]),
    ]);

    res.json({
      range,
      demand: demand.rows,
      categories: categories.rows,
      rising: rising.rows,
      topSkill: topSkill.rows.length ? topSkill.rows[0] : null,
      trend: trend.rows,
    });
  } catch (err) {
    console.error('Skills analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch skill analytics' });
  }
}

module.exports = { getSkills };
