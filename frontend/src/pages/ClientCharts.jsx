import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function buildHeatmap(rawData) {
  const grid = {};
  (rawData || []).forEach(({ day_of_week, hour_of_day, count }) => {
    const key = `${day_of_week}-${Math.floor(hour_of_day / 3) * 3}`;
    grid[key] = (grid[key] || 0) + parseInt(count);
  });
  const max = Math.max(...Object.values(grid), 1);
  return { grid, max };
}

export default function ClientCharts({ type, data, heatmapData }) {
  if (type === 'industry') {
    const chartData = (data || []).map((d) => ({ name: d.category, count: parseInt(d.job_count) }));
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9, fill: '#747780' }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#747780' }} width={70} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="count" fill="#001736" radius={[0, 3, 3, 0]} name="Jobs" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'heatmap') {
    const { grid, max } = buildHeatmap(heatmapData);
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mt-5">
            {HOURS.map((h) => (
              <div key={h} className="h-7 flex items-center text-[9px] text-on-surface-variant pr-1 w-6">
                {h}h
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {DAYS.map((d) => (
                <div key={d} className="text-[9px] text-on-surface-variant text-center font-bold">
                  {d}
                </div>
              ))}
            </div>
            {HOURS.map((h) => (
              <div key={h} className="grid grid-cols-7 gap-0.5 mb-0.5">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                  const key = `${d}-${h}`;
                  const val = grid[key] || 0;
                  const opacity = val ? Math.max(0.1, val / max) : 0.05;
                  return (
                    <div
                      key={d}
                      className="h-7 rounded-sm bg-primary cursor-default"
                      style={{ opacity }}
                      title={`${DAYS[d]} ${h}:00 — ${val} jobs`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
}
