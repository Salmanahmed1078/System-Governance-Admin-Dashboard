/**
 * PII masking for all JSON API responses (Module 9 policy).
 * Emails: partially redacted.
 * IPs: IPv4 dotted → first two octets + ".x.x" (handles ::ffff:, /32,/128 inet text, %zone).
 * Other address forms: literal "[redacted]" so we never leak full non-IPv4 strings by accident.
 */

function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const [domainName] = domain.split('.');
  return `${local[0]}***@***.${domain.split('.').pop()}`;
}

function maskIp(ip) {
  if (!ip || typeof ip !== 'string') return ip;
  let s = ip.trim();
  if (!s) return s;
  // Postgres inet ::text often includes /32 or /128; zones use %iface
  s = s.split('%')[0];
  if (/^::ffff:/i.test(s)) s = s.replace(/^::ffff:/i, '');
  s = s.replace(/\/\d+$/, '');
  const parts = s.split('.');
  const octetsOk =
    parts.length === 4 &&
    parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
  if (octetsOk) return `${parts[0]}.${parts[1]}.x.x`;
  return '[redacted]';
}

function maskObject(obj) {
  if (obj == null) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(maskObject);
  if (typeof obj === 'object') {
    const masked = {};
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'email') masked[key] = maskEmail(val);
      else if (key === 'ip_address' || key === 'ip' || key === 'client_ip')
        masked[key] = val == null ? val : maskIp(String(val));
      else masked[key] = maskObject(val);
    }
    return masked;
  }
  return obj;
}

function piiMask(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (data) => originalJson(maskObject(data));
  next();
}

module.exports = { piiMask, maskEmail, maskIp };
