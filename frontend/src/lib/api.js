import { getApiBaseUrl } from '@/lib/env';

const API_URL = getApiBaseUrl();

function getAdminHeaders() {
  if (typeof window === 'undefined') return {};
  const id =
    window.localStorage.getItem('x-admin-user-id') ||
    window.localStorage.getItem('m9_admin_user_id') ||
    window.sessionStorage.getItem('x-admin-user-id') ||
    window.sessionStorage.getItem('m9_admin_user_id');
  return id ? { 'x-admin-user-id': String(id) } : {};
}

async function fetchApi(path, init = {}) {
  try {
    const headers = { ...(init.headers || {}), ...getAdminHeaders() };
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...init, headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`fetchApi(${path}) failed:`, err.message);
    return null;
  }
}

export const api = {
  kpis: (range = '30d') => fetchApi(`/api/kpis/overview?range=${encodeURIComponent(range)}`),
  freelancers: (range = '30d') => fetchApi(`/api/analytics/freelancers?range=${encodeURIComponent(range)}`),
  clients: (range = '30d') => fetchApi(`/api/analytics/clients?range=${encodeURIComponent(range)}`),
  skills: (range = '30d') => fetchApi(`/api/analytics/skills?range=${encodeURIComponent(range)}`),
  usage: (range = '30d') => fetchApi(`/api/system/usage?range=${encodeURIComponent(range)}`),
  alerts: () => fetchApi('/api/governance/alerts'),
  audit: ({ page = 1, range = '30d', from = '', to = '', status = 'all' } = {}) =>
    fetchApi(
      `/api/audit/log?page=${encodeURIComponent(page)}&limit=20&range=${encodeURIComponent(range)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&status=${encodeURIComponent(status)}`
    ),
  exportHistory: () => fetchApi('/api/exports/history'),
  dataSources: () => fetchApi('/api/system/data-sources'),
  settings: () => fetchApi('/api/system/settings'),
  saveSettings: (payload) =>
    fetchApi('/api/system/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    }),
  currentAdmin: () => fetchApi('/api/system/current-admin'),
  trackUsage: (payload) =>
    fetchApi('/api/system/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    }),
};
