import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { RANGE_OPTIONS, parseRangeParam } from '@/lib/range';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DashboardCharts from './DashboardCharts';

function getRangeStartDate(range) {
  const d = new Date();
  if (range === '7d') d.setDate(d.getDate() - 6);
  else if (range === '30d') d.setDate(d.getDate() - 29);
  else d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function G09_DashboardPage() {
  const [searchParams] = useSearchParams();
  const selectedRange = useMemo(() => parseRangeParam(searchParams), [searchParams]);
  const [data, setData] = useState(null);
  const [alertPayload, setAlertPayload] = useState(null);

  useEffect(() => {
    document.title = 'G09_DashboardPage — M9 Analytics';
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    Promise.all([api.kpis(selectedRange), api.alerts()]).then(([kpiJson, alertsJson]) => {
      if (!alive) return;
      setData(kpiJson || {});
      setAlertPayload(alertsJson || { feed: [] });
    });
    return () => {
      alive = false;
    };
  }, [selectedRange]);

  if (!data || !alertPayload) {
    return <p className="text-sm text-on-surface-variant italic py-12 text-center">Loading…</p>;
  }

  const asOf = data?.asOf ? new Date(data.asOf) : null;
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated) : null;
  const dateOpts = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleString(undefined, dateOpts)
    : 'Not available';
  const asOfLabel = asOf ? asOf.toLocaleString(undefined, dateOpts) : null;

  const activeFreelancers = Number.isFinite(Number(data.activeFreelancers)) ? Number(data.activeFreelancers) : null;
  const clientHireRate = Number.isFinite(Number(data.clientHireRate)) ? Number(data.clientHireRate) : null;
  const skillVerifications = Number.isFinite(Number(data.skillVerifications)) ? Number(data.skillVerifications) : null;
  const totalSessions = Number.isFinite(Number(data.totalSessions)) ? Number(data.totalSessions) : null;

  const kpis = [
    { label: 'Active Freelancers', value: activeFreelancers != null ? activeFreelancers.toLocaleString() : '—', badge: null, icon: 'person', sub: 'Current active accounts' },
    { label: 'Client Hire Rate', value: clientHireRate != null ? `${clientHireRate}%` : '—', badge: null, icon: 'work', sub: 'Jobs converted to active/completed work' },
    {
      label: 'Skill Verifications',
      value: skillVerifications != null ? skillVerifications.toLocaleString() : '—',
      badge: null,
      icon: 'verified',
      sub: 'Verified requests',
    },
    {
      label: 'Platform Uptime',
      value: data.platformUptime != null ? `${Number(data.platformUptime).toFixed(2)}%` : '—',
      badge: null,
      icon: 'cloud_done',
      sub:
        `${totalSessions != null ? totalSessions.toLocaleString() : '—'} sessions in this period`,
      badgeType: 'up',
    },
  ];

  const rangeStart = getRangeStartDate(selectedRange);
  const recentAlerts = (alertPayload?.feed || [])
    .filter((alert) => new Date(alert.triggered_at) >= rangeStart)
    .slice(0, 4);
  const topSkills = data.topSkills || [];

  return (
    <div>
      <div className="mb-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-sm">
        <h2 className="text-lg font-black text-primary uppercase tracking-wide mb-4">Module 9 Workspace Index</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial No</th>
              <th>Page Name</th>
              <th>Function</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-bold text-on-surface-variant">01</td>
              <td className="font-bold text-primary">G09_DashboardPage</td>
              <td>Main entry point, platform overview and KPI aggregates</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">02</td>
              <td className="font-bold text-primary">G09_FreelancersPage</td>
              <td>Freelancer analytics, signups, leaderboard and pipeline</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">03</td>
              <td className="font-bold text-primary">G09_ClientsPage</td>
              <td>Client statistics, demand heatmap, and industry volume</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">04</td>
              <td className="font-bold text-primary">G09_SkillsPage</td>
              <td>Skill supply/demand gaps, verification trends, and forecasting</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">05</td>
              <td className="font-bold text-primary">G09_UsagePage</td>
              <td>System traffic, endpoint latency, device usage analytics</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">06</td>
              <td className="font-bold text-primary">G09_AlertsPage</td>
              <td>System governance alerts, trigger rules, and resolution notes</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">07</td>
              <td className="font-bold text-primary">G09_ReportsPage</td>
              <td>Data export generation and reporting history log</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">08</td>
              <td className="font-bold text-primary">G09_AuditPage</td>
              <td>Platform-wide security audit and compliance logs</td>
            </tr>
            <tr>
              <td className="font-bold text-on-surface-variant">09</td>
              <td className="font-bold text-primary">G09_SettingsPage</td>
              <td>Module administration and threshold configurations</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title">G09_DashboardPage</h1>
          <p className="page-subtitle">
            {asOfLabel ? (
              <>
                Updated {asOfLabel} · Latest activity: {lastUpdatedLabel}
              </>
            ) : (
              <>
                Latest activity: {lastUpdatedLabel}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant">
          {RANGE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              to={`/dashboard?range=${opt.key}`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRange === opt.key ? 'bg-primary text-white' : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ChartCard
            title="Platform Activity"
            action={
              <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Project Postings
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim inline-block" />
                  Bids Submitted
                </span>
              </div>
            }
          >
            <DashboardCharts type="activity" trend={data.trend || []} />
          </ChartCard>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Top Skill Demand</h3>
          {topSkills.length > 0 ? (
            <div className="space-y-3">
              {topSkills.map(({ skill, pct }) => (
                <div key={skill}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface font-medium">{skill}</span>
                    <span className="text-on-surface-variant font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
              <Link to="/skills" className="block text-center text-[10px] font-black uppercase tracking-wider text-primary hover:underline mt-2 pt-2 border-t border-outline-variant/20">
                View Full Skill Matrix
              </Link>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic mt-4 text-center">No skill data available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Quality Score Distribution">
          {data.qualityDistribution?.length > 0 ? (
            <DashboardCharts type="quality" distribution={data.qualityDistribution} />
          ) : (
            <p className="text-sm text-on-surface-variant italic h-[200px] flex items-center justify-center">No review data available.</p>
          )}
        </ChartCard>

        <div className="chart-card">
          <h3 className="chart-title">Recent Alerts</h3>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => {
                const icons = { critical: 'error', warning: 'warning', info: 'info', resolved: 'check_circle' };
                const colors = {
                  critical: 'text-red-500',
                  warning: 'text-amber-500',
                  info: 'text-blue-500',
                  resolved: 'text-emerald-500',
                };
                const ago = Math.round((Date.now() - new Date(alert.triggered_at)) / 60000);
                return (
                  <div key={alert.alert_id} className="flex gap-3">
                    <span className={`material-symbols-outlined text-[18px] mt-0.5 ${colors[alert.severity] || colors.info}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {icons[alert.severity] || 'info'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{alert.title}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {alert.resolution_notes} · {ago}m ago
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-on-surface-variant italic mt-4">No recent alerts recorded.</p>
            )}
            <Link to="/alerts" className="block text-[10px] font-black uppercase tracking-wider text-primary hover:underline pt-2 border-t border-outline-variant/20">
              View All Alerts →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
