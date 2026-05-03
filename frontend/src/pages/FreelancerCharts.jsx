import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FreelancerCharts({ type, data }) {
  if (type === 'signups') {
    const chartData = (data || []).map((d) => ({
      name: d.month || d.month_date,
      count: parseInt(d.count),
    }));
    return (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#747780' }} />
          <YAxis tick={{ fontSize: 9, fill: '#747780' }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="count" stroke="#001736" strokeWidth={2} dot={false} name="Signups" />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'pipeline') {
    const chartData = (data || []).map((d) => ({
      name: d.week || d.week_date,
      approved: parseInt(d.approved),
      pending: parseInt(d.pending),
    }));
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#747780' }} />
          <YAxis tick={{ fontSize: 9, fill: '#747780' }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="approved" fill="#001736" radius={[2, 2, 0, 0]} name="Approved" stackId="a" />
          <Bar dataKey="pending" fill="#dee8ff" radius={[2, 2, 0, 0]} name="Pending" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return null;
}
