import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

/** Normalize API snapshot_date (DATE / timestamptz / string) → YYYY-MM-DD using local calendar when needed. */
function snapshotToIso(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const mo = String(raw.getMonth() + 1).padStart(2, '0');
    const dd = String(raw.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dd}`;
  }
  return '';
}

/** Parse YYYY-MM-DD as LOCAL wall date (not UTC midnight) so axis keys stay unique across YTD. */
function parseSnapshotLocal(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const [y, m, d] = isoDate.split('-').map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
}

export default function DashboardCharts({ type, trend, distribution }) {
  if (type === 'activity') {
    const data = (trend || [])
      .map((d) => {
        const iso = snapshotToIso(d.snapshot_date);
        const projects = Number(d.total_projects) || 0;
        const bids = Number(d.total_bids) || 0;
        return { iso, projects, bids };
      })
      .filter((row) => row.iso.length === 10 && parseSnapshotLocal(row.iso) != null);
    const yMaxRaw = Math.max(1, ...data.flatMap((row) => [row.projects, row.bids]));
    const yCeil = Math.ceil(yMaxRaw * 1.12);
    const yAxisMax = Math.max(5, Math.ceil(yCeil / 5) * 5);

    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
          <XAxis
            dataKey="iso"
            type="category"
            tick={{ fontSize: 9, fill: '#747780' }}
            tickFormatter={(iso) => {
              const dt = parseSnapshotLocal(iso);
              return dt != null
                ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()
                : iso;
            }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis tick={{ fontSize: 9, fill: '#747780' }} domain={[0, yAxisMax]} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 11 }}
            labelFormatter={(iso) => {
              const dt = parseSnapshotLocal(iso);
              return dt != null
                ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                : iso;
            }}
          />
          <Line type="monotone" dataKey="projects" stroke="#001736" strokeWidth={2} dot={false} name="Project Postings" />
          <Line
            type="monotone"
            dataKey="bids"
            stroke="#6bd8cb"
            strokeWidth={2}
            dot={false}
            name="Bids Submitted"
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'quality') {
    const data = distribution ? distribution.map((d) => ({ label: `${d.rating} Star`, value: parseInt(d.count) })) : [];
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#747780' }} />
          <YAxis tick={{ fontSize: 9, fill: '#747780' }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="value" fill="#001736" radius={[3, 3, 0, 0]} name="Count" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return null;
}
