const { pool } = require('../db');

// GET /api/system/current-admin
async function getCurrentAdmin(req, res) {
  try {
    const raw = req.headers['x-admin-user-id'];
    const hid = raw != null && String(raw).trim() !== '' ? parseInt(String(raw).trim(), 10) : null;

    let q;
    if (hid != null && !Number.isNaN(hid)) {
      q = await pool.query(
        `SELECT id, first_name, last_name, email, role::text AS role
         FROM users
         WHERE id = $1 AND role IN ('admin', 'moderator')
         LIMIT 1`,
        [hid]
      );
    }

    if (!q || q.rows.length === 0) {
      q = await pool.query(
        `SELECT id, first_name, last_name, email, role::text AS role
         FROM users
         WHERE role IN ('admin', 'moderator')
         ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id ASC
         LIMIT 1`
      );
    }

    const row = q.rows[0];
    if (!row) return res.status(404).json({ error: 'No admin user found in centralized database' });

    const name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email || `ADM-${row.id}`;
    res.json({
      id: row.id,
      name,
      role: row.role,
      email: row.email || null,
    });
  } catch (err) {
    console.error('Current admin error:', err);
    res.status(500).json({ error: 'Failed to fetch current admin' });
  }
}

module.exports = { getCurrentAdmin };
