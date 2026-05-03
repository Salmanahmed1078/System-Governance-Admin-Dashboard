import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#001736', '#6bd8cb', '#a9c7ff', '#dee8ff'];

export default function UsageCharts({ type, data }) {
  if (type === 'traffic') {
    const trafficData = (data || []).map((d) => ({
      day: d.day,
      internal: Number(d.internal) || 0,
      external: Number(d.external) || 0,
    }));
    const yMaxRaw = Math.max(1, ...trafficData.flatMap((r) => [r.internal, r.external]));
    const yAxisMax = Math.max(5, Math.ceil(yMaxRaw * 1.12 / 5) * 5);

    return (
      <div className="h-[240px] w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trafficData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#747780' }} interval="preserveStartEnd" minTickGap={18} />
          <YAxis tick={{ fontSize: 9, fill: '#747780' }} domain={[0, yAxisMax]} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="linear" dataKey="internal" stroke="#001736" strokeWidth={2} dot={false} name="Internal" isAnimationActive={false} />
          <Line type="linear" dataKey="external" stroke="#6bd8cb" strokeWidth={2} dot={false} name="External" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      </div>
    );
  }
  if (type === 'devices' || type === 'browsers') {
    const chartData = (data || []).map((d) => ({ name: d.device || d.browser, value: parseInt(d.count) }));
    return (
      <div className="flex w-full shrink-0 flex-col gap-3">
        <div className="mx-auto h-[140px] w-full max-w-[260px]">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {chartData.map((d, i) => (
            <span key={d.name} className="flex items-center gap-1 text-[10px] font-medium text-on-surface-variant capitalize">
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
