import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RedStickyNote from './RedStickyNote';
import { api } from '@/lib/api';

function roleLabel(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Enterprise Admin';
  if (r === 'moderator') return 'Moderator';
  return 'Staff';
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return 'AD';
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}

export default function Topbar() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    let alive = true;
    api.currentAdmin().then((json) => {
      if (!alive) return;
      setAdmin(json || null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const displayName = admin?.name || 'Admin';
  const displayRole = roleLabel(admin?.role);
  const adminInitials = useMemo(() => initials(displayName), [displayName]);

  return (
    <header className="h-16 flex justify-between items-center w-full px-8 sticky top-0 z-50 backdrop-blur-md bg-opacity-90 bg-primary border-b border-primary-container/20">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none">M9</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-tertiary-fixed-dim">System Governance</p>
        </div>
        <nav className="hidden xl:flex items-center gap-8">
          <Link className="text-[11px] font-black uppercase tracking-widest text-white border-b-2 border-tertiary-fixed-dim pb-1" to="/dashboard">Overview</Link>
          <Link className="text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors" to="/reports">Reports</Link>
          <Link className="text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors" to="/audit">Audit Log</Link>
          <Link className="text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors" to="/settings">Settings</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 pl-4 border-l border-white/10 relative cursor-pointer">
        <RedStickyNote text="Links to G01 - User Profile" className="-left-4 top-1/2 -translate-x-full -translate-y-1/2" />
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-white uppercase tracking-wider">{displayName}</p>
          <p className="text-[9px] font-medium text-slate-400 uppercase">{displayRole}</p>
        </div>
        <div
          aria-label="Current admin avatar"
          className="w-9 h-9 rounded-lg border border-white/20 bg-primary-container/35 text-white text-[11px] font-black tracking-wide flex items-center justify-center"
        >
          {adminInitials}
        </div>
      </div>
    </header>
  );
}
