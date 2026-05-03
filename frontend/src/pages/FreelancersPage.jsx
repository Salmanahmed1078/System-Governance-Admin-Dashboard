import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { RANGE_OPTIONS, parseRangeParam } from '@/lib/range';
import ChartCard from '@/components/ChartCard';
import FreelancerCharts from './FreelancerCharts';

const tierColor = (t) =>
  ({
    elite: 'text-amber-600 bg-amber-50',
    advanced: 'text-blue-600 bg-blue-50',
    intermediate: 'text-slate-600 bg-slate-100',
  }[t] || 'text-slate-600 bg-slate-100');

export default function G09_FreelancersPage() {
  const [searchParams] = useSearchParams();
  const selectedRange = useMemo(() => parseRangeParam(searchParams), [searchParams]);
  const [data, setData] = useState(null);

  useEffect(() => {
    document.title = 'G09_FreelancersPage — M9';
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    api.freelancers(selectedRange).then((json) => {
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
  const avgRating = Number.isFinite(Number(kpis.avgRating)) ? Number(kpis.avgRating) : null;
  const completionRate = Number.isFinite(Number(kpis.completionRate)) ? Number(kpis.completionRate) : null;
  const avgHourlyRate = Number.isFinite(Number(kpis.avgHourlyRate)) ? Number(kpis.avgHourlyRate) : null;
  const responseTime = Number.isFinite(Number(kpis.responseTime)) ? Number(kpis.responseTime) : null;
  const leaderboard = data.leaderboard || [];
  const signups = data.signups || [];
  const pipeline = data.pipeline || [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title">G09_FreelancersPage</h1>
          <p className="page-subtitle">See freelancer performance for the selected time period.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant">
          {RANGE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              to={`/freelancers?range=${opt.key}`}
              className={`px-3 py-2 rounded-lg transition-colors ${
                selectedRange === opt.key ? 'bg-primary text-white' : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Avg Rating</p>
          <p className="kpi-value">
            {avgRating != null ? avgRating : '—'}
            <span className="text-base font-normal text-on-surface-variant">/5</span>
          </p>
          <span className="text-[10px] text-on-surface-variant">Based on recent reviews</span>
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`material-symbols-outlined text-[16px] ${avgRating != null && s <= avgRating ? 'text-amber-400' : 'text-outline-variant'}`}
                style={{ fontVariationSettings: avgRating != null && s <= avgRating ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            ))}
          </div>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Completion Rate</p>
          <p className="kpi-value">{completionRate != null ? `${completionRate}%` : '—'}</p>
          <span className="text-[10px] text-on-surface-variant">Share of projects finished successfully</span>
          <div className="mt-3 h-1.5 bg-surface-container rounded-full">
            <div className="h-full bg-primary rounded-full" style={{ width: `${completionRate ?? 0}%` }} />
          </div>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Response Time</p>
          <p className="kpi-value">
            {responseTime != null ? responseTime : '—'} <span className="text-base font-normal text-on-surface-variant">hrs</span>
          </p>
          <span className="text-[10px] text-on-surface-variant">Average reply time to new jobs</span>
          <p className="text-[10px] text-on-surface-variant mt-1">Avg Hourly Rate: {avgHourlyRate != null ? `$${avgHourlyRate}` : '—'}</p>
        </div>
      </div>

      <div className="mb-4 chart-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="chart-title">High-Performance Freelancers</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Freelancer ID</th>
              <th>Country</th>
              <th>Projects</th>
              <th>Rating</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length > 0 ? (
              leaderboard.map((f) => (
                <tr key={f.freelancer_id}>
                  <td className="font-black text-on-surface-variant">{f.rank != null ? String(f.rank).padStart(2, '0') : '—'}</td>
                  <td className="font-bold text-primary">{f.freelancer_id}</td>
                  <td>{f.country}</td>
                  <td>{f.projects}</td>
                  <td className="font-bold">{parseFloat(f.rating).toFixed(2)}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColor(f.tier_level)}`}>
                      {f.tier_level || 'standard'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-sm italic text-on-surface-variant">
                  No freelancer data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          title="New Signups"
          action={<span className="flex items-center gap-1 text-[10px] font-bold text-primary"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Monthly</span>}
        >
          {signups.length > 0 ? (
            <FreelancerCharts type="signups" data={signups} />
          ) : (
            <p className="text-sm text-on-surface-variant italic h-[180px] flex items-center justify-center">No signup data available.</p>
          )}
        </ChartCard>
        <ChartCard
          title="Verification Pipeline"
          action={
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Approved
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-surface-container-high inline-block" />
                Pending
              </span>
            </div>
          }
        >
          {pipeline.length > 0 ? (
            <FreelancerCharts type="pipeline" data={pipeline} />
          ) : (
            <p className="text-sm text-on-surface-variant italic h-[180px] flex items-center justify-center">No pipeline data available.</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
