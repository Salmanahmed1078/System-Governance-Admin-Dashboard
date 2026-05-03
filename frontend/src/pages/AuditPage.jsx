import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { RANGE_OPTIONS, parseRangeParam } from '@/lib/range';

function formatAuditTimestamp(ts) {
  if (ts == null || ts === '') return '-';
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return typeof ts === 'string' ? ts : '-';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function auditStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'success' || s === 'resolved') return 'badge-resolved';
  if (s === 'critical' || s === 'failed') return 'badge-critical';
  if (s === 'info') return 'badge-info';
  if (s === 'warning') return 'badge-warning';
  return 'badge-warning';
}

function auditQueryString(searchParams, overrides = {}) {
  const page = overrides.page ?? searchParams.get('page') ?? '1';
  const range = overrides.range ?? searchParams.get('range') ?? '30d';
  const fromVal = overrides.from !== undefined ? overrides.from : (searchParams.get('from') || '');
  const toVal = overrides.to !== undefined ? overrides.to : (searchParams.get('to') || '');
  const statusVal = overrides.status ?? searchParams.get('status') ?? 'all';
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('range', range);
  if (statusVal && statusVal !== 'all') params.set('status', statusVal);
  if (fromVal) params.set('from', fromVal);
  if (toVal) params.set('to', toVal);
  return params.toString();
}

export default function G09_AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const selectedRange = useMemo(() => parseRangeParam(searchParams), [searchParams]);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const status = searchParams.get('status') || 'all';
  const [data, setData] = useState(null);

  useEffect(() => {
    document.title = 'G09_AuditPage — M9';
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    api.audit({ page, range: selectedRange, from, to, status }).then((json) => {
      if (alive) setData(json);
    });
    return () => {
      alive = false;
    };
  }, [page, selectedRange, from, to, status]);

  if (!data) {
    return <p className="text-sm text-on-surface-variant italic py-12 text-center">Loading…</p>;
  }

  const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : 0;
  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const summary = data?.summary ?? {};
  const totalEvents = Number.isFinite(Number(summary.totalEvents)) ? Number(summary.totalEvents) : null;
  const securityAlerts = Number.isFinite(Number(summary.securityAlerts)) ? Number(summary.securityAlerts) : null;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">G09_AuditPage</h1>
          <p className="page-subtitle">Track important actions and system events.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant flex-shrink-0">
          {RANGE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              to={`/audit?${auditQueryString(searchParams, { page: 1, range: opt.key })}`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRange === opt.key ? 'bg-primary text-white' : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <form
        className="chart-card mb-4 p-3 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const nextFrom = (fd.get('from') || '').toString();
          const nextTo = (fd.get('to') || '').toString();
          const nextStatus = (fd.get('status') || 'all').toString().toLowerCase();
          const next = new URLSearchParams(searchParams);
          next.set('page', '1');
          if (nextStatus && nextStatus !== 'all') next.set('status', nextStatus);
          else next.delete('status');
          if (nextFrom) next.set('from', nextFrom);
          else next.delete('from');
          if (nextTo) next.set('to', nextTo);
          else next.delete('to');
          setSearchParams(next);
        }}
      >
        <input type="hidden" name="page" value="1" readOnly />
        <input type="hidden" name="range" value={selectedRange} readOnly />
        <label className="text-[11px] font-semibold text-on-surface-variant">
          From
          <input
            key={`from-${from}`}
            name="from"
            type="date"
            defaultValue={from}
            className="mt-1 block rounded-lg bg-surface-container px-2 py-1.5 text-xs"
          />
        </label>
        <label className="text-[11px] font-semibold text-on-surface-variant">
          To
          <input key={`to-${to}`} name="to" type="date" defaultValue={to} className="mt-1 block rounded-lg bg-surface-container px-2 py-1.5 text-xs" />
        </label>
        <label className="text-[11px] font-semibold text-on-surface-variant">
          Status
          <select
            name="status"
            value={status}
            onChange={(e) => {
              const nextStatus = String(e.target.value || 'all').toLowerCase();
              const next = new URLSearchParams(searchParams);
              next.set('page', '1');
              if (nextStatus && nextStatus !== 'all') next.set('status', nextStatus);
              else next.delete('status');
              setSearchParams(next);
            }}
            className="mt-1 block rounded-lg bg-surface-container px-2 py-1.5 text-xs"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="critical">Critical</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
          </select>
        </label>
        <button type="submit" className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold">
          Apply filters
        </button>
        <Link
          to={`/audit?${auditQueryString(searchParams, { page: 1, from: '', to: '' })}`}
          className="px-3 py-1.5 rounded-lg bg-surface-container text-[11px] font-bold text-on-surface-variant hover:bg-surface-container-high inline-block"
        >
          Reset dates
        </Link>
      </form>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Total Events</p>
          <p className="kpi-value">{totalEvents != null ? totalEvents.toLocaleString() : '—'}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">Logged actions</p>
        </div>
        <div className="kpi-card bg-red-50">
          <p className="kpi-label text-red-600">Security Alerts</p>
          <p className="kpi-value text-red-700">{securityAlerts != null ? securityAlerts : '—'}</p>
          <p className="text-[10px] text-red-500 mt-1">Requires attention</p>
        </div>
        <div className="kpi-card bg-emerald-50">
          <p className="kpi-label text-emerald-600">Integrity Status</p>
          <p className="kpi-value text-emerald-700">{summary.integrityStatus || '—'}</p>
          <p className="text-[10px] text-emerald-500 mt-1">Current overall health</p>
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="chart-title">Activity Timeline</h3>
          <span className="text-[10px] text-on-surface-variant">
            {total} total records · Page {page} of {totalPages}
          </span>
        </div>
        {logs.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source</th>
                <th>Admin ID</th>
                <th>Event Type</th>
                <th>Target Resource</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id ?? i}>
                  <td className="text-[10px] text-on-surface-variant whitespace-nowrap font-mono">{formatAuditTimestamp(log.timestamp)}</td>
                  <td>
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                      {log.category || '—'}
                    </span>
                  </td>
                  <td className="font-bold text-primary text-xs">{log.admin_id ? `ADM-${String(log.admin_id).padStart(4, '0')}` : 'SYSTEM'}</td>
                  <td>
                    <span className="bg-surface-container-high text-on-surface-variant text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                      {log.event_type || '-'}
                    </span>
                  </td>
                  <td className="text-xs text-on-surface-variant">{log.target_resource || '-'}</td>
                  <td className="text-[10px] font-mono text-on-surface-variant">{log.ip_address || '-'}</td>
                  <td>
                    <span className={auditStatusBadgeClass(log.status)}>{log.status || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-on-surface-variant italic py-8 text-center">No audit log records found.</p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/20">
          <Link
            to={page > 1 ? `/audit?${auditQueryString(searchParams, { page: page - 1 })}` : '#'}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
              page > 1 ? 'bg-surface-container text-primary hover:bg-surface-container-high' : 'text-on-surface-variant/40 pointer-events-none'
            }`}
          >
            ← Previous
          </Link>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                to={`/audit?${auditQueryString(searchParams, { page: p })}`}
                className={`w-8 h-8 flex items-center justify-center text-[11px] font-bold rounded-lg transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
          <Link
            to={page < totalPages ? `/audit?${auditQueryString(searchParams, { page: page + 1 })}` : '#'}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
              page < totalPages ? 'bg-surface-container text-primary hover:bg-surface-container-high' : 'text-on-surface-variant/40 pointer-events-none'
            }`}
          >
            Next →
          </Link>
        </div>
      </div>
    </div>
  );
}
