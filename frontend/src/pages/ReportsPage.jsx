import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/env';

const DATA_SOURCES = [
  { label: 'Freelancer Analytics', type: 'freelancer_analytics' },
  { label: 'Client Statistics', type: 'client_statistics' },
  { label: 'Skill Trends', type: 'skill_trends' },
  { label: 'Platform KPIs', type: 'platform_kpis' },
  { label: 'Audit Log', type: 'audit_log' },
  { label: 'Usage Report', type: 'usage_report' },
];

export default function G09_ReportsPage() {
  useEffect(() => {
    document.title = 'G09_ReportsPage — M9';
  }, []);

  const API = getApiBaseUrl();
  const [source, setSource] = useState('');
  const [format, setFormat] = useState('CSV');
  const [fromDate, setFromDate] = useState('2024-10-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API}/api/exports/history`, { cache: 'no-store' });
        if (!res.ok) return;
        const rows = await res.json();
        setHistory(rows || []);
      } catch {}
    }
    loadHistory();
  }, [API]);

  async function handleExport(e) {
    e.preventDefault();
    if (!source) {
      setMessage('Please select a data source.');
      return;
    }
    if (!fromDate || !toDate || fromDate > toDate) {
      setMessage('Please provide a valid date range.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const selected = DATA_SOURCES.find((s) => s.label === source);
      const type = selected?.type || 'freelancer_analytics';
      const res = await fetch(`${API}/api/exports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          type,
          dateRange: 'custom',
          filters: { fromDate, toDate },
        }),
      });
      if (!res.ok) throw new Error('Export failed');
      const auditHdr = res.headers.get('X-M9-Audit-Log');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `m9_${type}_${Date.now()}.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(
        auditHdr === 'failed'
          ? `✓ ${format} export downloaded, but audit log row was not written (check backend logs / DB).`
          : `✓ ${format} export generated successfully.`
      );

      const historyRes = await fetch(`${API}/api/exports/history`, { cache: 'no-store' });
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch {
      setMessage('Export failed. Please ensure the backend is running.');
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">G09_ReportsPage</h1>
        <p className="page-subtitle">Generate and download platform analytics reports.</p>
      </div>

      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <span className="material-symbols-outlined text-red-600 text-[22px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
          privacy_tip
        </span>
        <div>
          <p className="text-sm font-bold text-red-700">Important</p>
          <p className="text-xs text-red-600 mt-0.5">
            Sensitive information is hidden automatically in exported files. Exports expire after 7 days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="chart-title mb-5">Generate New Report</h3>
          <form onSubmit={handleExport} className="space-y-4">
            <div>
              <label htmlFor="m9-export-source" className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                Data Source
              </label>
              <select
                id="m9-export-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/30 outline-none"
              >
                <option value="">Select a data source...</option>
                {DATA_SOURCES.map((s) => (
                  <option key={s.type} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="m9-export-from" className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Date From
                </label>
                <input
                  id="m9-export-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/30 outline-none"
                />
              </div>
              <div>
                <label htmlFor="m9-export-to" className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Date To
                </label>
                <input
                  id="m9-export-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/30 outline-none"
                />
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">Output Format</span>
              <div className="flex gap-2">
                {['CSV', 'PDF'].map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                      format === f ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Generate & Download
                </>
              )}
            </button>
            {message && (
              <p className={`text-sm font-medium text-center ${message.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>{message}</p>
            )}
          </form>
        </div>

        <div className="chart-card">
          <h3 className="chart-title mb-4">Recent Export History</h3>
          <div className="space-y-3">
            {history.length > 0 ? (
              history.map((h) => {
                const generated = h.generated_at ? new Date(h.generated_at) : null;
                const expires = h.expires_at ? new Date(h.expires_at) : null;
                const expired = expires ? expires.getTime() < Date.now() : false;
                const sizeKb = Math.max(1, Math.round(Number(h.file_size_bytes || 0) / 1024));
                const status = expired ? 'expired' : 'ready';
                const typeLabel = String(h.export_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={h.export_id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        {h.format === 'PDF' ? 'picture_as_pdf' : 'table_view'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{typeLabel}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {Number(h.row_count || 0).toLocaleString()} rows · {sizeKb} KB ·{' '}
                          {generated ? generated.toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={status === 'ready' ? 'badge-resolved' : 'badge-warning'}>{status}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-on-surface-variant italic text-center py-6">No export history available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
