import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export default function G09_SettingsPage() {
  useEffect(() => {
    document.title = 'G09_SettingsPage — M9';
  }, []);

  const [dark, setDark] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [piiMaskEmail, setPiiMaskEmail] = useState(true);
  const [piiMaskIp, setPiiMaskIp] = useState(true);
  const [sources, setSources] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [sourcesMeta, setSourcesMeta] = useState({ loading: true, error: null });
  const [saveState, setSaveState] = useState({ saving: false, message: '' });

  const settingsPayload = useMemo(
    () => ({
      timeRange,
      dateFormat,
      autoRefresh,
      darkMode: dark,
      piiMaskEmail,
      piiMaskIp,
    }),
    [timeRange, dateFormat, autoRefresh, dark, piiMaskEmail, piiMaskIp]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const [settingsJson, sourcesJson] = await Promise.all([api.settings(), api.dataSources()]);
        if (cancelled) return;

        if (settingsJson?.settings) {
          setTimeRange(settingsJson.settings.timeRange || '30d');
          setDateFormat(settingsJson.settings.dateFormat || 'dd/mm/yyyy');
          setAutoRefresh(Boolean(settingsJson.settings.autoRefresh));
          setDark(Boolean(settingsJson.settings.darkMode));
          setPiiMaskEmail(Boolean(settingsJson.settings.piiMaskEmail));
          setPiiMaskIp(Boolean(settingsJson.settings.piiMaskIp));
        }
        setConnectors(Array.isArray(settingsJson?.connectors) ? settingsJson.connectors : []);

        setSources(Array.isArray(sourcesJson?.sources) ? sourcesJson.sources : []);
        setSourcesMeta({
          loading: false,
          error: settingsJson ? null : 'Failed to load settings',
          queriedAt: sourcesJson?.queriedAt || settingsJson?.queriedAt,
        });
      } catch (e) {
        if (!cancelled) setSourcesMeta({ loading: false, error: e.message || 'Failed to load' });
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAllSettings() {
    setSaveState({ saving: true, message: '' });
    const out = await api.saveSettings({
      settings: settingsPayload,
      connectors: connectors.map((c) => ({
        connectorId: c.connectorId,
        syncFrequencyMinutes: c.syncFrequencyMinutes,
        isActive: c.isActive,
      })),
    });
    if (out?.success) {
      setSaveState({ saving: false, message: `Saved at ${new Date(out.savedAt).toLocaleTimeString()}` });
      return;
    }
    setSaveState({ saving: false, message: 'Save failed. Please retry.' });
  }

  function updateConnector(connectorId, patch) {
    setConnectors((prev) =>
      prev.map((c) => (String(c.connectorId) === String(connectorId) ? { ...c, ...patch } : c))
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">G09_SettingsPage</h1>
          <p className="page-subtitle">Manage dashboard preferences and data visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveAllSettings}
            disabled={saveState.saving}
            className="px-3 py-2 rounded-lg bg-primary text-white text-[11px] font-bold disabled:opacity-60"
          >
            {saveState.saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saveState.message ? <span className="text-[10px] text-on-surface-variant">{saveState.message}</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="chart-title mb-4">General Configuration</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="m9-settings-range" className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                Default Time Range
              </label>
              <select
                id="m9-settings-range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg ring-1 ring-outline-variant/30 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
            <div>
              <label htmlFor="m9-settings-date-format" className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                Data Format
              </label>
              <select
                id="m9-settings-date-format"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-surface-container-low rounded-lg ring-1 ring-outline-variant/30 outline-none"
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                <option value="iso">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-sm font-bold text-on-surface">Auto-Refresh</p>
                <p className="text-[10px] text-on-surface-variant">
                  Changes apply to this browser only
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${autoRefresh ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title mb-4">System Appearance</h3>
          <div className="flex gap-3 mb-4">
            {[{ label: 'Light', icon: 'light_mode', active: !dark }, { label: 'Dark', icon: 'dark_mode', active: dark }].map(
              ({ label, icon, active }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDark(label === 'Dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors border-2 ${
                    active ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {label}
                </button>
              )
            )}
          </div>
          <p className="text-[10px] text-on-surface-variant">Theme preference is stored in Module 9 dashboard settings.</p>
        </div>

        <div className="chart-card">
          <h3 className="chart-title mb-4">Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-sm font-bold text-on-surface">Email Masking</p>
                <p className="text-[10px] text-on-surface-variant">Used when data is shown or exported</p>
              </div>
              <button
                type="button"
                onClick={() => setPiiMaskEmail(!piiMaskEmail)}
                className={`relative w-10 h-5 rounded-full transition-colors ${piiMaskEmail ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${piiMaskEmail ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
              <div>
                <p className="text-sm font-bold text-on-surface">IP Address Masking</p>
                <p className="text-[10px] text-on-surface-variant">Used when data is shown or exported</p>
              </div>
              <button
                type="button"
                onClick={() => setPiiMaskIp(!piiMaskIp)}
                className={`relative w-10 h-5 rounded-full transition-colors ${piiMaskIp ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${piiMaskIp ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[11px] font-bold text-amber-700">
                Privacy rules are applied automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title mb-4">Data Sources</h3>
          <p className="text-[10px] text-on-surface-variant mb-3">
            Current row counts from connected data sources
            {sourcesMeta.queriedAt ? ` · Updated ${new Date(sourcesMeta.queriedAt).toLocaleString()}` : ''}
          </p>
          <div className="space-y-3">
            {sourcesMeta.loading && <p className="text-sm text-on-surface-variant italic">Loading…</p>}
            {sourcesMeta.error && <p className="text-sm text-red-600">{sourcesMeta.error}</p>}
            {!sourcesMeta.loading &&
              !sourcesMeta.error &&
              sources.map((s) => (
                <div key={s.table} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-on-surface">{s.module}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">{s.table}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{Number(s.rowCount).toLocaleString()} rows</span>
                </div>
              ))}
            {!sourcesMeta.loading &&
              !sourcesMeta.error &&
              connectors.map((c) => (
                <div key={`connector-${c.connectorId}`} className="p-3 bg-surface-container-low rounded-lg">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-on-surface">{c.sourceModule}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        Connector #{c.connectorId} · Last status: {c.lastStatus || 'unknown'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConnector(c.connectorId, { isActive: !c.isActive })}
                      className={`text-[10px] font-bold px-2 py-1 rounded ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-outline-variant/30 text-on-surface-variant'}`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <label className="text-[10px] text-on-surface-variant">
                    Sync interval (minutes)
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={c.syncFrequencyMinutes}
                      onChange={(e) =>
                        updateConnector(c.connectorId, {
                          syncFrequencyMinutes: Math.max(1, Math.min(1440, parseInt(e.target.value || '1', 10))),
                        })
                      }
                      className="mt-1 w-full px-2 py-1.5 rounded bg-surface-container text-xs ring-1 ring-outline-variant/30 outline-none"
                    />
                  </label>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
