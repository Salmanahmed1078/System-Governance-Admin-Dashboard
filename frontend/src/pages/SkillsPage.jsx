import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { RANGE_OPTIONS, parseRangeParam } from '@/lib/range';
import ChartCard from '@/components/ChartCard';
import SkillCharts from './SkillCharts';

export default function G09_SkillsPage() {
  const [searchParams] = useSearchParams();
  const selectedRange = useMemo(() => parseRangeParam(searchParams), [searchParams]);
  const [data, setData] = useState(null);

  useEffect(() => {
    document.title = 'G09_SkillsPage — M9';
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    api.skills(selectedRange).then((json) => {
      if (alive) setData(json || {});
    });
    return () => {
      alive = false;
    };
  }, [selectedRange]);

  if (!data) {
    return <p className="text-sm text-on-surface-variant italic py-12 text-center">Loading…</p>;
  }

  const topSkill = data.topSkill ?? null;
  const demand = data.demand || [];
  const categories = data.categories || [];
  const rising = data.rising || [];
  const trend = data.trend || [];

  return (
    <div>
      <div className="bg-primary text-white rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-tertiary-fixed to-transparent" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary-fixed-dim">Top Trending Skill</p>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              {RANGE_OPTIONS.map((opt) => (
                <Link
                  key={opt.key}
                  to={`/skills?range=${opt.key}`}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedRange === opt.key ? 'bg-white text-primary' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-black font-headline leading-tight">G09_SkillsPage</h1>
          <h2 className="text-xl font-bold font-headline leading-tight mt-2">
            {topSkill?.skill_name ? (
              <>
                {topSkill.skill_name}:{' '}
                <span className="text-tertiary-fixed">{topSkill?.demand_pct ?? 0}%</span>
                <span className="text-white/95 font-semibold text-lg"> of skill-demand share</span>
              </>
            ) : (
              <>
                No single skill dominates this window
                <span className="text-white/95 font-semibold text-lg block mt-2">
                  Try a wider time period to see stronger trends.
                </span>
              </>
            )}
          </h2>
          <p className="text-white/75 mt-2 text-sm max-w-xl">
            This shows each skill's share of demand in the selected period.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ChartCard title="Skill Demand Over Time" subtitle="Top tech skills — job posting frequency">
            {trend.length > 0 ? (
              <SkillCharts type="demand" data={demand} trend={trend} />
            ) : (
              <p className="text-sm text-on-surface-variant italic h-[250px] flex items-center justify-center">No skill demand data.</p>
            )}
          </ChartCard>
        </div>
        <ChartCard title="Skill Category Mix">
          {categories.length > 0 ? (
            <SkillCharts type="donut" data={categories} trend={[]} />
          ) : (
            <p className="text-sm text-on-surface-variant italic h-[250px] flex items-center justify-center">No category mix data.</p>
          )}
        </ChartCard>
      </div>

      <div className="chart-card">
        <h3 className="chart-title mb-1">Rising Skills</h3>
        <p className="text-[11px] text-on-surface-variant mb-4">
          Compares this period with the previous period of the same length.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Category</th>
              <th>Demand (this period)</th>
              <th>Change vs previous period</th>
            </tr>
          </thead>
          <tbody>
            {rising.length > 0 ? (
              rising.map((s, i) => {
                const ch = parseFloat(s.mom_change_pct || 0);
                const up = ch >= 0;
                return (
                  <tr key={`${s.skill_name}-${i}`}>
                    <td className="font-bold text-primary">{s.skill_name}</td>
                    <td>
                      <span className="badge-info">{s.category}</span>
                    </td>
                    <td>{s.this_month}</td>
                    <td>
                      <span className={up ? 'kpi-badge-up' : 'kpi-badge-down'}>
                        {up ? '↑' : '↓'}
                        {Math.abs(ch).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-sm italic text-on-surface-variant">
                  No rising skills data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
