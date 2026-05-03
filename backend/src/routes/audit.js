const { pool } = require('../db');

/** Show IPv4-mapped IPv6 (::ffff:a.b.c.d) as dotted IPv4 for readability. */
function normalizeDisplayIp(ip) {
  if (ip == null || ip === '') return ip;
  const s = String(ip).trim();
  return /^::ffff:/i.test(s) ? s.replace(/^::ffff:/i, '') : s;
}

/**
 * Builds a unified audit feed by reading existing tables only (no new emitters required).
 *
 * Categories:
 * - analytics — m9_analytics_logs (e.g. export_triggered, future app events)
 * - identity — staff account creation timestamps (NOT per-session login — schema has no login log)
 * - governance — M9 alerts fired / resolved
 * - scheduling — scheduled report job runs (m9_scheduled_report_history)
 * - disputes — dispute_admin_audit_log (Module 8)
 * - gamification — gamification_admin_audit_logs (Module 11)
 *
 * GET /api/audit/log
 */
async function getAuditLog(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10) || 20));
    const offset = (page - 1) * limit;
    const range = ['7d', '30d', 'ytd'].includes(req.query.range) ? req.query.range : '30d';
    const allowedStatuses = ['success', 'critical', 'info', 'warning'];
    const requestedStatus = String(req.query.status || '').trim().toLowerCase();
    const statusFilter = allowedStatuses.includes(requestedStatus) ? requestedStatus : null;

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

    const fromDate = req.query.from ? new Date(req.query.from) : null;
    const toDate = req.query.to ? new Date(req.query.to) : null;
    const hasValidFrom = fromDate && !Number.isNaN(fromDate.getTime());
    const hasValidTo = toDate && !Number.isNaN(toDate.getTime());
    if (hasValidTo) toDate.setHours(23, 59, 59, 999);

    const startDt = hasValidFrom ? fromDate : rangeStart;
    const endDt = hasValidTo ? toDate : new Date('2099-12-31T23:59:59.999Z');

    const windowParams = [startDt, endDt];

    const unifiedFrom = `
      FROM (
        SELECT
          ('m9-' || log_id)::text AS synthetic_id,
          log_timestamp AS ts,
          user_id AS admin_id,
          role_flag AS role_flag,
          action AS event_type,
          COALESCE(NULLIF(TRIM(metadata->>'page'), ''), NULLIF(TRIM(metadata->>'export_type'), ''), '-') AS target_resource,
          CAST(ip_address AS TEXT) AS ip_address,
          CASE
            WHEN lower(COALESCE(action, '')) LIKE '%fail%'
              OR lower(COALESCE(action, '')) LIKE '%denied%'
              OR lower(COALESCE(action, '')) LIKE '%error%'
            THEN 'warning'
            ELSE 'success'
          END AS status,
          'analytics' AS category
        FROM m9_analytics_logs
        WHERE log_timestamp >= $1 AND log_timestamp <= $2

        UNION ALL

        SELECT
          ('usr-' || u.id)::text,
          u.created_at::timestamptz,
          u.id,
          u.role::text,
          'staff_account_registered'::text,
          'users · staff role'::text,
          NULL::text,
          'success'::text,
          'identity'::text
        FROM users u
        WHERE u.role IN ('admin', 'moderator')
          AND u.created_at::timestamptz >= $1 AND u.created_at::timestamptz <= $2

        UNION ALL

        SELECT
          ('alr-' || a.alert_id)::text,
          a.triggered_at,
          NULL::integer,
          NULL::text,
          'governance_alert_fired'::text,
          COALESCE(r.rule_name, '') || ' · severity ' || r.severity::text,
          NULL::text,
          CASE lower(trim(r.severity::text))
            WHEN 'critical' THEN 'critical'
            WHEN 'warning' THEN 'warning'
            WHEN 'info' THEN 'info'
            ELSE 'warning'
          END,
          'governance'::text
        FROM m9_alert_records a
        INNER JOIN m9_monitoring_rules r ON r.rule_id = a.rule_id
        WHERE a.triggered_at >= $1 AND a.triggered_at <= $2

        UNION ALL

        SELECT
          ('alx-' || a.alert_id)::text,
          a.resolved_at,
          a.resolved_by,
          NULL::text,
          'governance_alert_resolved'::text,
          COALESCE(r.rule_name, 'rule') ||
            CASE
              WHEN a.auto_resolved THEN ' · auto-resolved'
              WHEN a.resolution_notes IS NOT NULL AND length(trim(a.resolution_notes)) > 0
              THEN ' · notes: ' || LEFT(a.resolution_notes, 120)
              ELSE ''
            END::text,
          NULL::text,
          'resolved'::text,
          'governance'::text
        FROM m9_alert_records a
        INNER JOIN m9_monitoring_rules r ON r.rule_id = a.rule_id
        WHERE a.resolved_at IS NOT NULL
          AND a.resolved_at >= $1 AND a.resolved_at <= $2

        UNION ALL

        SELECT
          ('srh-' || h.history_id)::text,
          h.started_at,
          NULL::integer,
          NULL::text,
          ('scheduled_report_' || COALESCE(h.status, 'unknown'))::text,
          ('report_id ' || h.report_id::text ||
            CASE WHEN h.error_message IS NOT NULL THEN ' · ' || LEFT(h.error_message, 100) ELSE '' END)::text,
          NULL::text,
          CASE
            WHEN lower(trim(COALESCE(h.status, ''))) IN ('failed', 'error')
              OR h.error_message IS NOT NULL
            THEN 'failed'
            ELSE 'success'
          END::text,
          'scheduling'::text
        FROM m9_scheduled_report_history h
        WHERE h.started_at >= $1 AND h.started_at <= $2

        UNION ALL

        SELECT
          ('dsp-' || d.id)::text,
          d.performed_at::timestamptz,
          d.admin_id,
          NULL::text,
          ('dispute_' || lower(replace(trim(d.action_type::text), ' ', '_')))::text,
          (COALESCE(trim(d.target_entity_type), 'entity') || ' #' || d.target_entity_id::text)::text,
          CAST(d.ip_address AS TEXT),
          CASE WHEN COALESCE(lower(d.details), '') LIKE '%error%' THEN 'warning' ELSE 'success' END,
          'disputes'::text
        FROM dispute_admin_audit_log d
        WHERE d.performed_at >= $1 AND d.performed_at <= $2

        UNION ALL

        SELECT
          ('gaf-' || g.log_id)::text,
          g.created_at,
          g.admin_id,
          NULL::text,
          g.action::text,
          CASE WHEN g.target_user_id IS NOT NULL THEN 'target user #' || g.target_user_id::text ELSE 'platform' END::text,
          CAST(g.ip_address AS TEXT),
          'success'::text,
          'gamification'::text
        FROM gamification_admin_audit_logs g
        WHERE g.created_at >= $1 AND g.created_at <= $2
      ) unified
    `;

    const listSql = statusFilter
      ? `SELECT synthetic_id AS id, ts AS timestamp, admin_id, role_flag, event_type, target_resource, ip_address, status, category
         ${unifiedFrom}
         WHERE lower(status) = $3
         ORDER BY ts DESC
         LIMIT $4 OFFSET $5`
      : `SELECT synthetic_id AS id, ts AS timestamp, admin_id, role_flag, event_type, target_resource, ip_address, status, category
         ${unifiedFrom}
         ORDER BY ts DESC
         LIMIT $3 OFFSET $4`;
    const listParams = statusFilter
      ? [...windowParams, statusFilter, limit, offset]
      : [...windowParams, limit, offset];

    const totalSql = statusFilter
      ? `SELECT COUNT(*) AS c ${unifiedFrom} WHERE lower(status) = $3`
      : `SELECT COUNT(*) AS c ${unifiedFrom}`;
    const totalParams = statusFilter ? [...windowParams, statusFilter] : windowParams;

    const [logs, total, securitySummary, integrity] = await Promise.all([
      pool.query(listSql, listParams),
      pool.query(totalSql, totalParams),
      pool.query(
        `
        SELECT COUNT(*) AS security_alerts
        FROM m9_analytics_logs
        WHERE log_timestamp >= $1 AND log_timestamp <= $2
          AND (
            lower(COALESCE(action, '')) LIKE '%fail%'
            OR lower(COALESCE(action, '')) LIKE '%denied%'
            OR lower(COALESCE(action, '')) LIKE '%error%'
          )`,
        windowParams
      ),
      pool.query(`
        SELECT COUNT(*)::int AS open_critical
        FROM m9_alert_records a
        JOIN m9_monitoring_rules r ON r.rule_id = a.rule_id
        WHERE a.status = 'open' AND r.severity = 'critical'`),
    ]);

    const totalEvents = parseInt(total.rows[0]?.c || 0, 10);
    const securityAlerts = parseInt(securitySummary.rows[0]?.security_alerts || 0, 10);
    const openCritical = parseInt(integrity.rows[0]?.open_critical || 0, 10);
    const integrityStatus = openCritical > 0 ? 'Critical alerts open' : 'No open critical alerts';

    const logRows = logs.rows.map((row) =>
      row.ip_address != null ? { ...row, ip_address: normalizeDisplayIp(row.ip_address) } : row
    );

    res.json({
      range,
      status: statusFilter || 'all',
      from: hasValidFrom ? fromDate.toISOString().slice(0, 10) : null,
      to: hasValidTo ? toDate.toISOString().slice(0, 10) : null,
      total: totalEvents,
      page,
      limit,
      summary: {
        totalEvents,
        securityAlerts,
        integrityStatus,
      },
      logs: logRows,
    });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
}

module.exports = { getAuditLog };
