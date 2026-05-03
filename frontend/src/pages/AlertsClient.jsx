import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/env';

const SUMMARY_CARD_ORDER = ['critical', 'warning', 'info', 'acknowledged', 'resolved'];

const SEV_CONFIG = {
  critical: { label: 'Critical', icon: 'diamond', color: 'text-red-600', bg: 'bg-red-50', barColor: 'bg-red-500' },
  warning: { label: 'Warning', icon: 'warning', color: 'text-amber-600', bg: 'bg-amber-50', barColor: 'bg-amber-500' },
  info: { label: 'Info', icon: 'info', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500' },
  resolved: { label: 'Resolved', icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500' },
  acknowledged: {
    label: 'Acknowledged',
    icon: 'done_all',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    barColor: 'bg-violet-500',
  },
};

function timeAgo(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function AlertsClient({ initialFeed = [], initialSummary = {}, rules = [] }) {
  const [feed, setFeed] = useState(initialFeed);
  const [summary, setSummary] = useState(initialSummary);
  const [filter, setFilter] = useState('Active');
  const [ackLoading, setAckLoading] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const API = getApiBaseUrl();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/governance/alerts`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setFeed(data.feed || []);
      setSummary(data.summary || {});
      setLastRefresh(new Date());
    } catch {}
  }, [API]);

  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  async function handleAcknowledge(alertId) {
    setAckLoading(alertId);
    try {
      const res = await fetch(`${API}/api/governance/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setFeed((prev) =>
          prev.map((a) =>
            String(a.alert_id) === String(alertId)
              ? { ...a, status: 'acknowledged', resolution_notes: 'Acknowledged by admin.' }
              : a
          )
        );
        setSummary((prev) => ({ ...prev }));
        await refresh();
      }
    } catch {}
    setAckLoading(null);
  }

  const filteredFeed = feed.filter((a) => {
    if (filter === 'Active') return a.status === 'open' || a.status === 'acknowledged';
    if (filter === 'Resolved') return a.status === 'resolved';
    return true;
  });

  const TABS = ['Active', 'Resolved', 'All'];

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Platform / Monitoring / <span className="text-primary">Alerts</span>
          </p>
          <h1 className="page-title flex items-center gap-2">
            G09_AlertsPage
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </h1>
          <p className="page-subtitle">
            Real-time system health notifications and security triggers.{' '}
            <span className="text-[10px] text-on-surface-variant">Last updated: {timeAgo(lastRefresh.toISOString())}</span>
          </p>
        </div>

        <div className="flex gap-1 text-[11px] font-bold">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === t ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ...SUMMARY_CARD_ORDER.filter((k) => Object.prototype.hasOwnProperty.call(summary, k)),
          ...Object.keys(summary).filter((k) => !SUMMARY_CARD_ORDER.includes(k)),
        ].map((sev) => {
          const count = summary[sev];
          const cfg = SEV_CONFIG[sev] || SEV_CONFIG.info;
          return (
            <div key={sev} className={`kpi-card ${cfg.bg}`}>
              <div className="flex items-center justify-between">
                <p className={`text-[11px] font-black uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
                <span className={`material-symbols-outlined text-[18px] ${cfg.color}`}>{cfg.icon}</span>
              </div>
              <p className={`text-4xl font-black mt-2 ${cfg.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 chart-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-on-surface-variant">
              Showing <span className="text-primary font-black">{filteredFeed.length}</span> alerts
              {filter !== 'All' && ` · ${filter}`}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Refresh
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8" />
                <th>Title & Description</th>
                <th>Rule Triggered</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeed.length > 0 ? (
                filteredFeed.map((alert) => {
                  const cfg = SEV_CONFIG[alert.severity] || SEV_CONFIG.info;
                  const isAcknowledged = alert.status === 'acknowledged';
                  const isResolved = alert.status === 'resolved';
                  const isLoading = ackLoading === alert.alert_id || ackLoading === String(alert.alert_id);

                  return (
                    <tr key={alert.alert_id}>
                      <td>
                        <div
                          className={`w-1 h-10 rounded-sm ${
                            isResolved ? 'bg-emerald-500' : isAcknowledged ? 'bg-violet-500' : cfg.barColor
                          }`}
                        />
                      </td>
                      <td>
                        <p className="font-bold text-on-surface text-xs">{alert.title}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {alert.resolution_notes
                            ? alert.resolution_notes
                            : alert.metric_value && alert.expected_value
                              ? `${alert.metric_name}: ${parseFloat(alert.metric_value).toFixed(2)} ${alert.operator} ${parseFloat(
                                  alert.expected_value
                                ).toFixed(2)} (${parseFloat(alert.deviation_percentage).toFixed(1)}% deviation)`
                              : alert.metric_name}
                        </p>
                      </td>
                      <td>
                        <span className="bg-surface-container-high text-on-surface-variant text-[9px] font-bold px-2 py-1 rounded font-mono">
                          {(alert.rule_name || alert.title || 'SYSTEM').replace(/\s/g, '-')}
                        </span>
                      </td>
                      <td className="text-[11px] text-on-surface-variant whitespace-nowrap">{timeAgo(alert.triggered_at)}</td>
                      <td>
                        {isResolved ? (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Resolved
                          </span>
                        ) : isAcknowledged ? (
                          <span className="text-[11px] text-violet-600 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">done_all</span>
                            Acknowledged
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(alert.alert_id)}
                            disabled={isLoading}
                            className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                          >
                            {isLoading ? (
                              <>
                                <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                                ...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[12px]">done</span>
                                Acknowledge
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-sm italic text-on-surface-variant">
                    {filter === 'Active'
                      ? 'No active alerts — system is healthy ✅'
                      : filter === 'Resolved'
                        ? 'No resolved alerts yet.'
                        : 'No alerts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="chart-title">Alert Rules</h3>
            <button type="button" className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
          <div className="space-y-3">
            {rules.length > 0 ? (
              rules.map((rule) => (
                <div key={rule.rule_id} className="flex gap-3">
                  <span
                    className={`status-dot mt-1.5 flex-shrink-0 ${
                      rule.is_active ? (rule.severity === 'critical' ? 'bg-red-500' : 'bg-emerald-500') : 'bg-outline-variant'
                    }`}
                  />
                  <div>
                    <p className={`text-xs font-bold ${rule.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {rule.rule_name}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      {rule.is_active
                        ? `Trigger when ${rule.metric_name} ${rule.operator} ${parseFloat(rule.threshold).toFixed(0)}`
                        : 'Status: Disabled by admin.'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant italic">No alert rules configured.</p>
            )}
            <p className="block text-[11px] font-bold text-on-surface-variant pt-2 border-t border-outline-variant/20">
              Showing all {rules.length} rules
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-[11px] font-bold text-blue-700">Monitoring Health</p>
            <p className="text-[10px] text-blue-600 mt-1">Scheduler evaluates metrics every 60s. Page refreshes every 30s.</p>
            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={`health-bar-${i}`} className="flex-1 h-1 bg-blue-400 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
