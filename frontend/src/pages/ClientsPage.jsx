import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { RANGE_OPTIONS, parseRangeParam } from '@/lib/range';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import ClientCharts from './ClientCharts';

export default function G09_ClientsPage() {
  const [searchParams] = useSearchParams();
  const selectedRange = useMemo(() => parseRangeParam(searchParams), [searchParams]);
  const [data, setData] = useState(null);

  useEffect(() => {
    document.title = 'G09_ClientsPage — M9';
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    api.clients(selectedRange).then((json) => {
      if (alive) setData(json || {});
    });
    return () => {
      alive = false;
    };
  }, [selectedRange]);

  if (!data) {
    return <p className="text-sm text-on-surface-variant italic py-12 text-center">Loading…</p>;
  }

  const kpis = data.kpis ?? {};
  const activeClients = Number.isFinite(Number(kpis.activeClients)) ? Number(kpis.activeClients) : null;
  const jobsPosted = Number.isFinite(Number(kpis.jobsPosted)) ? Number(kpis.jobsPosted) : null;
  const avgTimeToHire = Number.isFinite(Number(kpis.avgTimeToHire)) ? Number(kpis.avgTimeToHire) : null;
  const repeatHireRate = Number.isFinite(Number(kpis.repeatHireRate)) ? Number(kpis.repeatHireRate) : null;
  const topClients = data.topClients || [];
  const industryVolume = data.industryVolume || [];
  const heatmap = data.heatmap || [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title">G09_ClientsPage</h1>
          <p className="page-subtitle">Hiring trends, client performance, and demand analytics.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant">
          {RANGE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              to={`/clients?range=${opt.key}`}
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
        <KpiCard label="Active Clients" value={activeClients != null ? activeClients.toLocaleString() : '—'} icon="business" sub={`Time period: ${selectedRange.toUpperCase()}`} />
        <KpiCard label="Jobs Posted" value={jobsPosted != null ? jobsPosted.toLocaleString() : '—'} icon="work" sub="Total job posts in this period" />
        <KpiCard label="Avg Time-to-Hire" value={avgTimeToHire != null ? `${avgTimeToHire} days` : '—'} icon="schedule" sub="Average time to make a hire" />
        <KpiCard label="Repeat Hire Rate" value={repeatHireRate != null ? `${repeatHireRate}%` : '—'} icon="repeat" sub="Clients who posted more than once" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Hiring Volume by Industry">
          {industryVolume.length > 0 ? (
            <ClientCharts type="industry" data={industryVolume} />
          ) : (
            <p className="text-sm text-on-surface-variant italic h-[220px] flex items-center justify-center">No industry volume data.</p>
          )}
        </ChartCard>
        <ChartCard title="Hiring Activity Heatmap" subtitle="Jobs posted by hour and day of week">
          {heatmap.length > 0 ? (
            <ClientCharts type="heatmap" heatmapData={heatmap} />
          ) : (
            <p className="text-sm text-on-surface-variant italic h-[220px] flex items-center justify-center">No hiring heatmap data.</p>
          )}
        </ChartCard>
      </div>

      <div className="chart-card">
        <h3 className="chart-title mb-4">Top Hiring Clients</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Country</th>
              <th>Jobs Posted</th>
              <th>Active Projects</th>
              <th>Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {topClients.length > 0 ? (
              topClients.map((c, i) => (
                <tr key={i}>
                  <td className="font-bold text-primary">{c.name}</td>
                  <td>
                    <span className="badge-info">{c.country}</span>
                  </td>
                  <td>{c.jobs_posted}</td>
                  <td>{c.projects_active}</td>
                  <td className="font-bold">{c.total_spend != null ? `$${Number(c.total_spend).toLocaleString()}` : '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-sm italic text-on-surface-variant">
                  No client data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
