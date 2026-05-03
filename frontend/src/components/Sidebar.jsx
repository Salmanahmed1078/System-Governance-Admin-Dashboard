import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { href: '/dashboard', icon: 'dashboard', label: 'G09_DashboardPage' },
  { href: '/freelancers', icon: 'person', label: 'G09_FreelancersPage' },
  { href: '/clients', icon: 'business', label: 'G09_ClientsPage' },
  { href: '/skills', icon: 'psychology', label: 'G09_SkillsPage' },
  { href: '/usage', icon: 'analytics', label: 'G09_UsagePage' },
  { href: '/alerts', icon: 'notifications_active', label: 'G09_AlertsPage' },
  { href: '/reports', icon: 'download', label: 'G09_ReportsPage' },
  { href: '/audit', icon: 'history', label: 'G09_AuditPage' },
];

const BOTTOM_NAV = [{ href: '/settings', icon: 'settings', label: 'G09_SettingsPage' }];

function navActive(pathname, href) {
  if (pathname === href) return true;
  if (href === '/dashboard') return false;
  return pathname.startsWith(`${href}/`) || pathname === href;
}

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col p-4 bg-surface-container-low bg-gradient-to-b from-surface-container-low to-surface border-r border-outline-variant/20 z-40">
      <nav className="flex-grow space-y-1 overflow-y-auto">
        <div className="px-3 mb-4">
          <p className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant mt-1">Navigation</p>
        </div>
        {NAV.map(({ href, icon, label }) => {
          const active = navActive(pathname, href);
          return (
            <Link key={href} to={href} className={active ? 'nav-item-active' : 'nav-item'}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="pt-4 border-t border-outline-variant/10 space-y-1">
          {BOTTOM_NAV.map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} to={href} className={active ? 'nav-item-active' : 'nav-item'}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
