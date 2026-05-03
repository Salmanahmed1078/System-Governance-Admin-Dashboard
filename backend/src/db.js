const { Pool } = require('pg');

const DB_HOST = process.env.DB_HOST;
const DB_PORT_RAW = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

const missing = [];
if (!DB_HOST) missing.push('DB_HOST');
if (!DB_USER) missing.push('DB_USER');
if (DB_PASSWORD === undefined || DB_PASSWORD === '') missing.push('DB_PASSWORD');
if (!DB_NAME) missing.push('DB_NAME');

if (missing.length > 0) {
  console.error(
    `[m9-db] Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy module9/.env.example to module9/.env (or set variables in Docker Compose) — do not hardcode credentials in source code.'
  );
  process.exit(1);
}

const pool = new Pool({
  host: DB_HOST,
  port: parseInt(DB_PORT_RAW || '5432', 10),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = { pool };
