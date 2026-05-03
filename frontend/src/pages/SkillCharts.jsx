import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#001736', '#405f91', '#6bd8cb', '#a9c7ff', '#dee8ff', '#89f5e7'];

function buildTrendData(rows) {
  const byPeriod = new Map();
  (rows || []).forEach((r) => {
    if (!byPeriod.has(r.period_label)) byPeriod.set(r.period_label, { period: r.period_label });
    byPeriod.get(r.period_label)[r.skill_name] = parseInt(r.demand_count || 0);
  });
  return Array.from(byPeriod.values());
}

export default function SkillCharts({ type, data, trend }) {
  if (type === 'demand') {
    const chartData = buildTrendData(trend);
    const topSkills = [...new Set((trend || []).map((r) => r.skill_name))].slice(0, 5);
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
          <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#747780' }} />
          <YAxis tick={{ fontSize: 9, fill: '#747780' }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {topSkills.map((s, i) => (
            <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'donut') {
    const chartData = (data || []).map((d) => ({ name: d.category, value: parseInt(d.count) }));
    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n) => [v, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {chartData.map((d, i) => (
            <span key={d.name} className="flex items-center gap-1 text-[10px] font-medium text-on-surface-variant">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
