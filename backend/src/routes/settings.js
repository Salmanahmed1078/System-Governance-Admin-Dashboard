const { pool } = require('../db');

const SETTINGS_CONFIG_NAME = 'g09_settings';
const SETTINGS_DASHBOARD_TYPE = 'settings';

function toBool(v, fallback = false) {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

function toInt(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function resolveAdminActor(req) {
  const raw = req.headers['x-admin-user-id'];
  if (raw != null && String(raw).trim() !== '') {
    const id = parseInt(String(raw).trim(), 10);
    if (!Number.isNaN(id)) {
      const match = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND role IN ('admin', 'moderator') LIMIT 1`,
        [id]
      );
      if (match.rows[0]) return match.rows[0].id;
    }
  }
  const fallback = await pool.query(
    `SELECT id FROM users WHERE role IN ('admin', 'moderator') ORDER BY id ASC LIMIT 1`
  );
  return fallback.rows[0]?.id || null;
}

async function getSettings(req, res) {
  try {
    const actorId = await resolveAdminActor(req);
    if (!actorId) {
      return res.status(409).json({
        error: 'No admin/moderator account available in centralized users table.',
      });
    }

    const [configQ, connectorsQ] = await Promise.all([
      pool.query(
        `SELECT widgets
         FROM m9_dashboard_configs
         WHERE user_id = $1
           AND config_name = $2
           AND dashboard_type = $3
         ORDER BY updated_at DESC
         LIMIT 1`,
        [actorId, SETTINGS_CONFIG_NAME, SETTINGS_DASHBOARD_TYPE]
      ),
      pool.query(
        `SELECT connector_id, source_module, source_table, sync_frequency_minutes, is_active, last_status, last_fetched
         FROM m9_data_connectors
         ORDER BY source_module ASC, connector_id ASC`
      ),
    ]);

    const widgets = configQ.rows[0]?.widgets || {};
    const settings = {
      timeRange: ['7d', '30d', '90d', 'ytd'].includes(String(widgets.timeRange || ''))
        ? widgets.timeRange
        : '30d',
      dateFormat: ['dd/mm/yyyy', 'mm/dd/yyyy', 'iso'].includes(String(widgets.dateFormat || ''))
        ? widgets.dateFormat
        : 'dd/mm/yyyy',
      autoRefresh: toBool(widgets.autoRefresh, true),
      darkMode: toBool(widgets.darkMode, false),
      piiMaskEmail: toBool(widgets.piiMaskEmail, true),
      piiMaskIp: toBool(widgets.piiMaskIp, true),
    };

    return res.json({
      actorId,
      settings,
      connectors: connectorsQ.rows.map((r) => ({
        connectorId: r.connector_id,
        sourceModule: r.source_module,
        sourceTable: r.source_table,
        syncFrequencyMinutes: toInt(r.sync_frequency_minutes, 60),
        isActive: toBool(r.is_active, true),
        lastStatus: r.last_status || 'unknown',
        lastFetched: r.last_fetched || null,
      })),
      queriedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Settings read error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

async function saveSettings(req, res) {
  try {
    const actorId = await resolveAdminActor(req);
    if (!actorId) {
      return res.status(409).json({
        error: 'No admin/moderator account available in centralized users table.',
      });
    }

    const body = req.body || {};
    const settings = body.settings || {};
    const connectors = Array.isArray(body.connectors) ? body.connectors : [];

    const payload = {
      timeRange: ['7d', '30d', '90d', 'ytd'].includes(String(settings.timeRange || ''))
        ? settings.timeRange
        : '30d',
      dateFormat: ['dd/mm/yyyy', 'mm/dd/yyyy', 'iso'].includes(String(settings.dateFormat || ''))
        ? settings.dateFormat
        : 'dd/mm/yyyy',
      autoRefresh: toBool(settings.autoRefresh, true),
      darkMode: toBool(settings.darkMode, false),
      piiMaskEmail: toBool(settings.piiMaskEmail, true),
      piiMaskIp: toBool(settings.piiMaskIp, true),
    };

    await pool.query(
      `INSERT INTO m9_dashboard_configs (user_id, config_name, dashboard_type, widgets, layout, is_default, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NULL, true, NOW())
       ON CONFLICT (user_id, config_name)
       DO UPDATE SET widgets = EXCLUDED.widgets, updated_at = NOW()`,
      [actorId, SETTINGS_CONFIG_NAME, SETTINGS_DASHBOARD_TYPE, JSON.stringify(payload)]
    );

    for (const c of connectors) {
      const connectorId = toInt(c.connectorId, null);
      if (connectorId == null) continue;
      const sync = Math.max(1, Math.min(1440, toInt(c.syncFrequencyMinutes, 60)));
      const isActive = toBool(c.isActive, true);
      await pool.query(
        `UPDATE m9_data_connectors
         SET sync_frequency_minutes = $1,
             is_active = $2,
             updated_at = NOW()
         WHERE connector_id = $3`,
        [sync, isActive, connectorId]
      );
    }

    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Settings save error:', err);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
}

module.exports = { getSettings, saveSettings };
