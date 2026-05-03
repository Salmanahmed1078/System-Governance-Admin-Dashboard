/**
 * Module 9 — Real-Time Metrics Scheduler
 * ----------------------------------------
 * Runs every 60 seconds. Calculates live system metrics from:
 *   - Node.js OS module (CPU, Memory)
 *   - Express middleware request counters
 *   - m9_export_records (export job durations)
 *   - pg pool (DB connection queue depth)
 *
 * Compares each metric against m9_monitoring_rules thresholds.
 * Writes ONLY to m9_alert_records — centralized DB is read-only.
 */

const os = require('os');
const { pool } = require('../db');

// ─── In-memory request counters (reset every 60s) ───────────────────────────
let requestCount = 0;
let errorCount = 0;
let totalResponseMs = 0;
let prevCpuTimes = null;

/**
 * Express middleware — tracks request count, error count, and response time.
 * Attach this BEFORE routes in app.js.
 */
function trackRequest(req, res, next) {
  const start = Date.now();
  requestCount++;

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    totalResponseMs += duration;
    if (res.statusCode >= 500) errorCount++;
    return originalEnd.apply(this, args);
  };

  next();
}

// ─── CPU Usage (delta between two samples) ───────────────────────────────────
function getCpuPercent() {
  const cpus = os.cpus();

  if (!prevCpuTimes) {
    prevCpuTimes = cpus;
    // First call — fall back to load average × 10 as rough approximation
    const load = os.loadavg()[0];
    return Math.min(100, load * 10);
  }

  let totalDelta = 0;
  let idleDelta = 0;

  cpus.forEach((cpu, i) => {
    const prev = prevCpuTimes[i];
    if (!prev) return;
    const prevTotal = Object.values(prev.times).reduce((a, b) => a + b, 0);
    const currTotal = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    totalDelta += currTotal - prevTotal;
    idleDelta  += cpu.times.idle - prev.times.idle;
  });

  prevCpuTimes = cpus;
  const pct = totalDelta > 0 ? ((totalDelta - idleDelta) / totalDelta) * 100 : 0;
  return Math.min(100, Math.max(0, parseFloat(pct.toFixed(2))));
}

// ─── Collect all metrics ─────────────────────────────────────────────────────
async function collectMetrics() {
  const elapsedMinutes = 1; // We reset every 60 s so this is always 1 min window

  const cpuPercent        = getCpuPercent();
  const freeMemMB         = parseFloat((os.freemem() / 1024 / 1024).toFixed(2));
  const avgResponseMs     = requestCount > 0 ? parseFloat((totalResponseMs / requestCount).toFixed(2)) : 0;
  const errorRatePct      = requestCount > 0 ? parseFloat(((errorCount / requestCount) * 100).toFixed(2)) : 0;
  const reqPerMinute      = parseFloat((requestCount / elapsedMinutes).toFixed(2));
  const queueDepth        = pool.waitingCount ?? 0;

  // Export job duration from analytics logs (seconds) in last hour
  let exportJobDurationSec = 0;
  try {
    const r = await pool.query(`
      SELECT MAX((metadata->>'duration_ms')::numeric) / 1000.0 AS dur
      FROM m9_analytics_logs
      WHERE log_timestamp > NOW() - INTERVAL '1 hour'
        AND lower(COALESCE(action, '')) = 'export_triggered'
        AND (metadata->>'duration_ms') IS NOT NULL`);
    exportJobDurationSec = parseFloat(r.rows[0]?.dur ?? 0);
  } catch (_) { /* table may be empty */ }

  // Disk latency — approximate via a lightweight DB round-trip timing
  let diskLatencyMs = 0;
  try {
    const t0 = Date.now();
    await pool.query('SELECT 1');
    diskLatencyMs = Date.now() - t0;
  } catch (_) {}

  // Payment latency — avg ms between milestone approval and release
  let paymentLatencyMs = 0;
  try {
    const r = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (released_at - approved_at)) * 1000) AS avg_ms
      FROM milestone_payments
      WHERE release_status = 'released'
        AND approved_at IS NOT NULL
        AND released_at IS NOT NULL
        AND released_at > NOW() - INTERVAL '24 hours'`);
    paymentLatencyMs = parseFloat(r.rows[0]?.avg_ms ?? 0);
  } catch (_) {}

  let failedLoginsPerMinute = 0;
  try {
    const r = await pool.query(`
      SELECT COUNT(*)::float AS c
      FROM m9_analytics_logs
      WHERE log_timestamp > NOW() - INTERVAL '1 minute'
        AND lower(COALESCE(action, '')) LIKE 'failed_login%'`);
    failedLoginsPerMinute = parseFloat(r.rows[0]?.c ?? 0);
  } catch (_) {}

  let dbConnectionsPercent = 0;
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*)::float AS active_connections,
        current_setting('max_connections')::float AS max_connections
      FROM pg_stat_activity`);
    const active = parseFloat(r.rows[0]?.active_connections ?? 0);
    const max = parseFloat(r.rows[0]?.max_connections ?? 1);
    dbConnectionsPercent = max > 0 ? parseFloat(((active / max) * 100).toFixed(2)) : 0;
  } catch (_) {}

  let scheduledBackupStatus = 0;
  try {
    const r = await pool.query(`
      SELECT COUNT(*)::int AS c
      FROM m9_analytics_logs
      WHERE log_timestamp > NOW() - INTERVAL '24 hours'
        AND lower(COALESCE(action, '')) = 'backup_completed'`);
    scheduledBackupStatus = parseInt(r.rows[0]?.c ?? 0) > 0 ? 1 : 0;
  } catch (_) {}

  let fraudScore = 0;
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE verification_status IN ('rejected', 'pending'))::float AS risky,
        COUNT(*)::float AS total
      FROM verification_requests
      WHERE requested_at > NOW() - INTERVAL '24 hours'`);
    const risky = parseFloat(r.rows[0]?.risky ?? 0);
    const total = parseFloat(r.rows[0]?.total ?? 0);
    fraudScore = total > 0 ? parseFloat((risky / total).toFixed(4)) : 0;
  } catch (_) {}

  let zeroBidJobsPercent = 0;
  try {
    const r = await pool.query(`
      WITH recent_jobs AS (
        SELECT id FROM jobs WHERE created_at > NOW() - INTERVAL '24 hours'
      )
      SELECT
        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1 FROM bids b WHERE b.job_id = j.id
          )
        )::float AS zero_bid_jobs,
        COUNT(*)::float AS total_jobs
      FROM recent_jobs j`);
    const zeroBid = parseFloat(r.rows[0]?.zero_bid_jobs ?? 0);
    const totalJobs = parseFloat(r.rows[0]?.total_jobs ?? 0);
    zeroBidJobsPercent = totalJobs > 0 ? parseFloat(((zeroBid / totalJobs) * 100).toFixed(2)) : 0;
  } catch (_) {}

  // Reset counters for next window
  requestCount  = 0;
  errorCount    = 0;
  totalResponseMs = 0;

  return {
    cpu_usage_percent:      cpuPercent,
    free_memory_mb:         freeMemMB,
    api_response_ms:        avgResponseMs,
    error_rate_percent:     errorRatePct,
    requests_per_minute:    reqPerMinute,
    queue_depth:            queueDepth,
    export_job_duration_sec: exportJobDurationSec,
    disk_latency_ms:        diskLatencyMs,
    payment_latency_ms:     paymentLatencyMs,
    failed_logins_per_minute: failedLoginsPerMinute,
    db_connections_percent: dbConnectionsPercent,
    scheduled_backup_status: scheduledBackupStatus,
    fraud_score:            fraudScore,
    zero_bid_jobs_percent:  zeroBidJobsPercent,
  };
}

// ─── Threshold comparison ─────────────────────────────────────────────────────
function isBreached(value, operator, threshold) {
  const v = parseFloat(value);
  const t = parseFloat(threshold);
  switch (operator) {
    case '>':  return v > t;
    case '<':  return v < t;
    case '>=': return v >= t;
    case '<=': return v <= t;
    case '=':  return v === t;
    default:   return false;
  }
}

function calcDeviationPct(value, operator, threshold) {
  const v = parseFloat(value);
  const t = parseFloat(threshold);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t === 0) return 0;

  let diff = 0;
  if (operator === '>' || operator === '>=') diff = v - t;
  else if (operator === '<' || operator === '<=') diff = t - v;
  else diff = Math.abs(v - t);

  const pct = (Math.max(0, diff) / Math.abs(t)) * 100;
  return parseFloat(pct.toFixed(2));
}

// ─── Main evaluation loop ─────────────────────────────────────────────────────
async function evaluateRules() {
  try {
    const [rulesResult, metrics] = await Promise.all([
      pool.query(`
        SELECT rule_id, rule_name, metric_name, operator, threshold, severity
        FROM m9_monitoring_rules
        WHERE is_active = true`),
      collectMetrics(),
    ]);

    for (const rule of rulesResult.rows) {
      const metricValue = metrics[rule.metric_name];

      // Skip metrics we cannot measure
      if (metricValue === undefined) continue;

      const breached = isBreached(metricValue, rule.operator, rule.threshold);

      if (breached) {
        // Only fire once — don't duplicate open alerts for the same rule
        const existing = await pool.query(
          `SELECT alert_id FROM m9_alert_records WHERE rule_id = $1 AND status = 'open' LIMIT 1`,
          [rule.rule_id]
        );

        if (existing.rows.length === 0) {
          const threshold = parseFloat(rule.threshold);
          let deviation = calcDeviationPct(metricValue, rule.operator, threshold);
          
          // Cap at 999999.99 to fit into postgres numeric(8,2) without altering the centralized DB schema
          if (deviation > 999999.99) deviation = 999999.99;

          await pool.query(`
            INSERT INTO m9_alert_records
              (rule_id, metric_value, expected_value, deviation_percentage, triggered_at, status, auto_resolved)
            VALUES ($1, $2, $3, $4, NOW(), 'open', false)`,
            [rule.rule_id, metricValue, threshold, deviation]
          );

          console.log(`🚨 Alert fired: ${rule.rule_name} | ${rule.metric_name} = ${metricValue} ${rule.operator} ${rule.threshold}`);
        }
      } else {
        // Auto-resolve any open alerts for this rule (metric is back to normal)
        const resolved = await pool.query(`
          UPDATE m9_alert_records
          SET status = 'resolved',
              resolved_at = NOW(),
              resolution_notes = 'Metric returned to normal. Auto-resolved by monitoring agent.',
              auto_resolved = true
          WHERE rule_id = $1 AND status = 'open'
          RETURNING alert_id`, [rule.rule_id]
        );

        if (resolved.rowCount > 0) {
          console.log(`✅ Auto-resolved: ${rule.rule_name}`);
        }
      }
    }

    console.log(`📊 Metrics evaluated at ${new Date().toISOString()} | CPU: ${metrics.cpu_usage_percent}% | Mem: ${metrics.free_memory_mb}MB free | RPS: ${metrics.requests_per_minute}`);
  } catch (err) {
    console.error('Metrics evaluation error:', err.message);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
function startScheduler(intervalMs = 60000) {
  console.log(`📊 Monitoring scheduler started — evaluating every ${intervalMs / 1000}s`);
  evaluateRules(); // Run immediately on startup
  setInterval(evaluateRules, intervalMs);
}

function getErrorRate() {
  return requestCount > 0 ? parseFloat(((errorCount / requestCount) * 100).toFixed(2)) : 0;
}

module.exports = { startScheduler, trackRequest, getErrorRate };
