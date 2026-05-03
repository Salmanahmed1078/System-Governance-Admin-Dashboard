const { pool } = require('../db');

/**
 * Module 9 — Automated KPI Aggregator
 * -----------------------------------
 * Runs periodically to scan the centralized database and aggregate
 * total platform metrics into m9_kpi_snapshots for the current day.
 * Ensures the Overview dashboard trend charts are 100% real-time.
 */
async function aggregateDailyKPIs() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Run parallel aggregation queries
    const [
      usersRes,
      projectsRes,
      financialsRes,
      reviewsRes,
      verificationsRes,
      gigsRes
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'freelancer' AND account_status = 'active' THEN 1 END) as active_freelancers,
          COUNT(CASE WHEN role = 'client' AND account_status = 'active' THEN 1 END) as active_clients
        FROM users
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_projects,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) FILTER (WHERE status = 'completed') as avg_completion_days
        FROM projects
      `),
      pool.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_volume,
          COALESCE(SUM(amount * 0.10), 0) as revenue
        FROM milestone_payments 
        WHERE release_status = 'released'
      `),
      pool.query(`
        SELECT COALESCE(AVG(rating), 0) as avg_rating 
        FROM reviews
      `),
      pool.query(`
        SELECT COUNT(*) as certs_issued 
        FROM verification_requests 
        WHERE verification_status = 'verified'
      `),
      pool.query(`
        SELECT COUNT(*) as active_gigs 
        FROM gigs 
        WHERE is_active = true
      `)
    ]);

    const users = usersRes.rows[0];
    const projects = projectsRes.rows[0];
    const financials = financialsRes.rows[0];
    const reviews = reviewsRes.rows[0];
    const verifications = verificationsRes.rows[0];
    const gigs = gigsRes.rows[0];

    // UPSERT into m9_kpi_snapshots
    await pool.query(`
      INSERT INTO m9_kpi_snapshots (
        snapshot_date,
        total_users,
        active_freelancers,
        active_clients,
        total_projects,
        completed_projects,
        disputed_projects,
        total_transaction_volume,
        platform_revenue,
        avg_project_completion_days,
        avg_rating,
        certifications_issued,
        active_gigs
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT (snapshot_date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_freelancers = EXCLUDED.active_freelancers,
        active_clients = EXCLUDED.active_clients,
        total_projects = EXCLUDED.total_projects,
        completed_projects = EXCLUDED.completed_projects,
        disputed_projects = EXCLUDED.disputed_projects,
        total_transaction_volume = EXCLUDED.total_transaction_volume,
        platform_revenue = EXCLUDED.platform_revenue,
        avg_project_completion_days = EXCLUDED.avg_project_completion_days,
        avg_rating = EXCLUDED.avg_rating,
        certifications_issued = EXCLUDED.certifications_issued,
        active_gigs = EXCLUDED.active_gigs,
        created_at = NOW()
    `, [
      today,
      parseInt(users.total_users),
      parseInt(users.active_freelancers),
      parseInt(users.active_clients),
      parseInt(projects.total_projects),
      parseInt(projects.completed_projects),
      parseInt(projects.disputed_projects),
      parseFloat(financials.total_volume),
      parseFloat(financials.revenue),
      parseFloat(projects.avg_completion_days || 0),
      parseFloat(reviews.avg_rating),
      parseInt(verifications.certs_issued),
      parseInt(gigs.active_gigs)
    ]);

    console.log(`📈 KPI Aggregator: Snapshot updated for ${today}`);
  } catch (err) {
    console.error('KPI Aggregator Error:', err);
  }
}

function startKpiAggregator(intervalMs = 3600000) { // Default 1 hour
  console.log(`📈 KPI Aggregator started — running every ${intervalMs / 1000 / 60}m`);
  aggregateDailyKPIs(); // Run immediately on startup
  setInterval(aggregateDailyKPIs, intervalMs);
}

module.exports = { startKpiAggregator, aggregateDailyKPIs };
