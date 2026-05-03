const { pool } = require('../db');

// GET /api/analytics/freelancers
async function getFreelancers(req, res) {
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

    const [kpis, leaderboard, signups, pipeline] = await Promise.all([
      pool.query(`
        WITH project_stats AS (
          SELECT
            p.freelancer_id,
            COUNT(*) AS total_projects,
            COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects
          FROM projects p
          WHERE p.created_at >= $1
          GROUP BY p.freelancer_id
        ),
        review_stats AS (
          SELECT
            r.freelancer_id,
            AVG(r.rating) AS avg_rating
          FROM reviews r
          WHERE r.created_at >= $1
          GROUP BY r.freelancer_id
        ),
        response_stats AS (
          SELECT
            b.freelancer_id,
            AVG(EXTRACT(EPOCH FROM (b.submitted_at - j.created_at)) / 3600.0) AS response_time_hours
          FROM bids b
          JOIN jobs j ON j.id = b.job_id
          WHERE b.submitted_at >= $1
          GROUP BY b.freelancer_id
        )
        SELECT
          ROUND(COALESCE(AVG(rs.avg_rating), 0)::numeric, 2) AS avg_rating,
          ROUND(
            COALESCE(
              SUM(ps.completed_projects) * 100.0 / NULLIF(SUM(ps.total_projects), 0),
              0
            )::numeric,
            1
          ) AS completion_rate,
          ROUND(COALESCE(AVG(pr.hourly_rate), 0)::numeric, 0) AS avg_hourly_rate,
          ROUND(COALESCE(AVG(resp.response_time_hours), 0)::numeric, 1) AS response_time_hours
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        LEFT JOIN project_stats ps ON ps.freelancer_id = u.id
        LEFT JOIN review_stats rs ON rs.freelancer_id = u.id
        LEFT JOIN response_stats resp ON resp.freelancer_id = u.id
        WHERE u.role = 'freelancer' AND u.account_status = 'active'`, [rangeStart]),
      pool.query(`
        WITH project_stats AS (
          SELECT
            p.freelancer_id,
            COUNT(*) AS total_projects,
            COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects
          FROM projects p
          WHERE p.created_at >= $1
          GROUP BY p.freelancer_id
        ),
        review_stats AS (
          SELECT
            r.freelancer_id,
            AVG(r.rating) AS avg_rating
          FROM reviews r
          WHERE r.created_at >= $1
          GROUP BY r.freelancer_id
        )
        SELECT 
          ROW_NUMBER() OVER (
            ORDER BY
              COALESCE(rs.avg_rating, 0) DESC,
              COALESCE(
                ps.completed_projects * 100.0 / NULLIF(ps.total_projects, 0),
                0
              ) DESC
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
        ORDER BY rating DESC, completion_rate DESC
        LIMIT 20`, [rangeStart]),
      pool.query(`
        WITH signups_bucket AS (
          SELECT DATE_TRUNC(
            CASE 
              WHEN $2 = '7d' THEN 'day'
              WHEN $2 = '30d' THEN 'week'
              ELSE 'month'
            END,
            created_at
          ) AS period_start
          FROM users
          WHERE role = 'freelancer'
            AND created_at >= $1
        )
        SELECT 
          TO_CHAR(
            period_start,
            CASE 
              WHEN $2 = '7d' THEN 'DD Mon'
              WHEN $2 = '30d' THEN '"Wk" IW'
              ELSE 'Mon'
            END
          ) AS month,
          period_start AS month_date,
          COUNT(*) AS count
        FROM signups_bucket
        GROUP BY period_start
        ORDER BY period_start ASC`, [rangeStart, range]),
      pool.query(`
        WITH pipeline_bucket AS (
          SELECT
            DATE_TRUNC(
              CASE
                WHEN $2 = '7d' THEN 'day'
                WHEN $2 = '30d' THEN 'week'
                ELSE 'month'
              END,
              requested_at
            ) AS period_start,
            verification_status
          FROM verification_requests
          WHERE requested_at >= $1
        )
        SELECT 
          TO_CHAR(
            period_start,
            CASE 
              WHEN $2 = '7d' THEN 'DD Mon'
              WHEN $2 = '30d' THEN '"Wk" IW'
              ELSE 'Mon'
            END
          ) AS week,
          COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) AS approved,
          COUNT(CASE WHEN verification_status = 'pending' OR verification_status = 'in_review' THEN 1 END) AS pending
        FROM pipeline_bucket
        GROUP BY period_start
        ORDER BY period_start ASC`, [rangeStart, range]),
    ]);

    res.json({
      range,
      kpis: {
        avgRating: parseFloat(kpis.rows[0]?.avg_rating || 0),
        completionRate: parseFloat(kpis.rows[0]?.completion_rate || 0),
        avgHourlyRate: parseFloat(kpis.rows[0]?.avg_hourly_rate || 0),
        responseTime: parseFloat(kpis.rows[0]?.response_time_hours || 0),
      },
      leaderboard: leaderboard.rows,
      signups: signups.rows,
      pipeline: pipeline.rows,
    });
  } catch (err) {
    console.error('Freelancers analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch freelancer analytics' });
  }
}

module.exports = { getFreelancers };
