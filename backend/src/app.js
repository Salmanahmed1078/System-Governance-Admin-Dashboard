const path = require('path');
// Load env from module9/.env or backend/.env (never hardcode secrets in source)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { piiMask } = require('./middleware/piiMask');
const { trackRequest, startScheduler } = require('./services/metricsScheduler');
const { startKpiAggregator } = require('./services/kpiAggregator');
const { getOverview } = require('./routes/kpis');
const { getFreelancers } = require('./routes/freelancers');
const { getClients } = require('./routes/clients');
const { getSkills } = require('./routes/skills');
const { getUsage, trackUsageEvent } = require('./routes/usage');
const { getAlerts, acknowledgeAlert } = require('./routes/alerts');
const { generateExport, getHistory } = require('./routes/exports');
const { getAuditLog } = require('./routes/audit');
const { getDataSources } = require('./routes/dataSources');
const { getCurrentAdmin } = require('./routes/currentAdmin');
const { getSettings, saveSettings } = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 4000;
app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: ['X-M9-Audit-Log'],
  })
);
app.use(express.json());
app.use(trackRequest); // Real-time request counter for metrics
app.use(piiMask);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Routes ──────────────────────────────────────────────────────────────
// KPIs
app.get('/api/kpis/overview', getOverview);

// Analytics (READ-ONLY on core tables)
app.get('/api/analytics/freelancers', getFreelancers);
app.get('/api/analytics/clients', getClients);
app.get('/api/analytics/skills', getSkills);

// System Usage
app.get('/api/system/usage', getUsage);
app.post('/api/system/track', trackUsageEvent);
app.get('/api/system/data-sources', getDataSources);
app.get('/api/system/current-admin', getCurrentAdmin);
app.get('/api/system/settings', getSettings);
app.patch('/api/system/settings', saveSettings);

// Governance
app.get('/api/governance/alerts', getAlerts);
app.patch('/api/governance/alerts/:id/acknowledge', acknowledgeAlert);

// Audit Log
app.get('/api/audit/log', getAuditLog);

// Exports (READ core tables + WRITE to m9_export_records)
app.post('/api/exports/generate', generateExport);
app.get('/api/exports/history', getHistory);

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 M9 Backend running on http://localhost:${PORT}`);
  startScheduler(60000); // Evaluate metrics every 60 seconds
  startKpiAggregator();  // Aggregate KPIs every hour
});

module.exports = app;
