import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { RANGE_OPTIONS, parseRangeParam } from '@/lib/range';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import UsageCharts from './UsageCharts';

export default function G09_UsagePage() {
  const [searchParams] = useSearchParams();
  const selectedRange = useMemo(() => parseRangeParam(searchParams), [searchParams]);
  const [data, setData] = useState(null);

  useEffect(() => {
    document.title = 'G09_UsagePage — M9';
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    api.usage(selectedRange).then((json) => {
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
  const totalSessions = Number.isFinite(Number(kpis.totalSessions)) ? Number(kpis.totalSessions) : null;
  const avgSessionDuration = Number.isFinite(Number(kpis.avgSessionDuration)) ? Number(kpis.avgSessionDuration) : null;
  const pageViews = Number.isFinite(Number(kpis.pageViews)) ? Number(kpis.pageViews) : null;
  const bounceRate = Number.isFinite(Number(kpis.bounceRate)) ? Number(kpis.bounceRate) : null;
  const traffic = data.traffic || [];
  const devices = data.devices || [];
  const browsers = data.browsers || [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-title">G09_UsagePage</h1>
          <p className="page-subtitle">Session analytics, traffic sources, and system performance metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant">
          {RANGE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              to={`/usage?range=${opt.key}`}
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
        <KpiCard
          label="Total Sessions"
          value={totalSessions != null ? totalSessions.toLocaleString() : '—'}
          icon="timeline"
          sub={`Time period: ${selectedRange.toUpperCase()}`}
        />
        <KpiCard
          label="Avg Session Duration"
          value={avgSessionDuration != null ? `${Math.round(avgSessionDuration / 60)}m ${Math.round(avgSessionDuration % 60)}s` : '—'}
          icon="timer"
          sub="Average time people stayed during each visit"
        />
        <KpiCard
          label="Page Views"
          value={pageViews != null ? pageViews.toLocaleString() : '—'}
          icon="visibility"
          sub="How many pages were opened during this period"
        />
        <KpiCard
          label="Bounce Rate"
          value={bounceRate != null ? `${bounceRate}%` : '—'}
          icon="exit_to_app"
          sub="Visits where someone left after viewing only one page"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ChartCard title="Traffic Over Time" subtitle="Page views — internal admins vs external analysts">
            {traffic.length > 0 ? (
              <UsageCharts type="traffic" data={traffic} />
            ) : (
              <p className="text-sm text-on-surface-variant italic h-[250px] flex items-center justify-center">No traffic data available.</p>
            )}
          </ChartCard>
        </div>
        <div className="space-y-4">
          <ChartCard title="Device Breakdown" subtitle="From page_view events">
            {devices.length > 0 ? (
              <UsageCharts type="devices" data={devices} />
            ) : (
              <p className="text-sm text-on-surface-variant italic h-[150px] flex items-center justify-center">No device data.</p>
            )}
          </ChartCard>
          <ChartCard title="Browser Breakdown" subtitle="From page_view events">
            {browsers.length > 0 ? (
              <UsageCharts type="browsers" data={browsers} />
            ) : (
              <p className="text-sm text-on-surface-variant italic h-[150px] flex items-center justify-center">No browser data.</p>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
