import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { api } from '@/lib/api';

function detectDevice(ua) {
  const s = String(ua || '').toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobi|android|iphone/.test(s)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua) {
  const s = String(ua || '').toLowerCase();
  if (s.includes('edg/')) return 'Edge';
  if (s.includes('firefox/')) return 'Firefox';
  if (s.includes('safari/') && !s.includes('chrome/')) return 'Safari';
  if (s.includes('chrome/')) return 'Chrome';
  return 'Other';
}

function getUsageSessionId() {
  if (typeof window === 'undefined') return null;
  const key = 'm9_usage_session_id';
  let id = window.localStorage.getItem(key);
  if (id) return id;
  id = `m9-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, id);
  return id;
}

export default function AppLayout() {
  const location = useLocation();
  const lastTrackedRef = useRef('');

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`;
    if (!path || lastTrackedRef.current === path) return;
    lastTrackedRef.current = path;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const payload = {
      action: 'page_view',
      page: path,
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      sessionId: getUsageSessionId(),
    };
    api.trackUsage(payload);
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <Topbar />
      {/* min-h-0 lets nested flex/grid children shrink; avoids footer overlapping chart areas */}
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="ml-64 flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-8 py-8 lg:px-12 lg:py-12">
            <Outlet />
          </div>
          <footer className="shrink-0 border-t border-outline-variant/15 bg-surface-container-low px-6 py-8 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Module 9 — Analytics &amp; Governance (Centralized DB) • See Alerts &amp; KPIs for live status
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
