const { pool } = require('../db');

// GET /api/governance/alerts
async function getAlerts(req, res) {
  try {
    const [summary, feed, rules] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(CASE WHEN r.severity = 'critical' AND a.status IN ('open', 'acknowledged') THEN 1 END) AS critical,
          COUNT(CASE WHEN r.severity = 'warning'  AND a.status IN ('open', 'acknowledged') THEN 1 END) AS warning,
          COUNT(CASE WHEN r.severity = 'info'     AND a.status IN ('open', 'acknowledged') THEN 1 END) AS info,
          COUNT(CASE WHEN a.status = 'acknowledged' THEN 1 END) AS acknowledged,
          COUNT(CASE WHEN a.status = 'resolved' THEN 1 END) AS resolved
        FROM m9_alert_records a
        JOIN m9_monitoring_rules r ON r.rule_id = a.rule_id`),
      pool.query(`
        SELECT
          a.alert_id,
          r.rule_name AS title,
          r.rule_name,
          r.severity,
          r.metric_name,
          r.operator,
          a.metric_value,
          a.expected_value,
          a.deviation_percentage,
          a.status,
          a.triggered_at,
          a.resolved_at,
          a.resolution_notes,
          a.auto_resolved
        FROM m9_alert_records a
        JOIN m9_monitoring_rules r ON r.rule_id = a.rule_id
        ORDER BY a.triggered_at DESC
        LIMIT 500`),
      pool.query(`
        SELECT
          rule_id,
          rule_name,
          metric_name,
          operator,
          threshold,
          severity,
          evaluation_interval_minutes,
          is_active,
          created_at
        FROM m9_monitoring_rules
        ORDER BY severity DESC, rule_name ASC`),
    ]);

    res.json({
      summary: summary.rows[0] || { critical: 0, warning: 0, info: 0, acknowledged: 0, resolved: 0 },
      feed: feed.rows,
      rules: rules.rows,
    });
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}

// PATCH /api/governance/alerts/:id/acknowledge
async function acknowledgeAlert(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      UPDATE m9_alert_records
      SET status = 'acknowledged',
          resolution_notes = 'Acknowledged by admin.',
          resolved_at = NULL,
          auto_resolved = false
      WHERE alert_id = $1 AND status = 'open'
      RETURNING alert_id, status`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found or already acknowledged.' });
    }
    res.json({ success: true, alert: result.rows[0] });
  } catch (err) {
    console.error('Acknowledge error:', err);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
}

module.exports = { getAlerts, acknowledgeAlert };
