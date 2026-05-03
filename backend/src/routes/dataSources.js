const { pool } = require('../db');

/**
 * GET /api/system/data-sources
 * Read-only row counts from representative centralized tables (per module area).
 * No mock latency/status — integration group sees real DB reachability + volume.
 */
async function getDataSources(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::bigint FROM users) AS users_count,
        (SELECT COUNT(*)::bigint FROM ec_skill_assessments) AS skill_assessments_count,
        (SELECT COUNT(*)::bigint FROM jobs) AS jobs_count,
        (SELECT COUNT(*)::bigint FROM milestone_payments) AS milestone_payments_count,
        (SELECT COUNT(*)::bigint FROM disputes) AS disputes_count,
        (SELECT COUNT(*)::bigint FROM gamification_user_progress) AS gamification_count
    `);
    const r = rows[0];
    const n = (v) => parseInt(v || 0, 10);

    res.json({
      sources: [
        { module: 'Module 1 — User Identity', table: 'users', rowCount: n(r.users_count) },
        { module: 'Module 2 — Skill Testing', table: 'ec_skill_assessments', rowCount: n(r.skill_assessments_count) },
        { module: 'Module 3 — Marketplace', table: 'jobs', rowCount: n(r.jobs_count) },
        { module: 'Module 7 — Payments', table: 'milestone_payments', rowCount: n(r.milestone_payments_count) },
        { module: 'Module 8 — Disputes', table: 'disputes', rowCount: n(r.disputes_count) },
        { module: 'Module 11 — Gamification', table: 'gamification_user_progress', rowCount: n(r.gamification_count) },
      ],
      queriedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Data sources error:', err);
    res.status(500).json({ error: 'Failed to read centralized database source stats' });
  }
}

module.exports = { getDataSources };
