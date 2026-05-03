export default function KpiCard({ label, value, badge, badgeType = 'up', icon, sub }) {
  const badgeClass = badgeType === 'up' ? 'kpi-badge-up' : 'kpi-badge-down';
  const badgeArrow = badgeType === 'up' ? '↑' : '↓';
  const textInset = icon ? 'pr-[4.75rem]' : '';

  return (
    <div className="kpi-card relative overflow-hidden min-h-[7.75rem]">
      <div className={`relative z-10 ${textInset}`}>
        <p className="kpi-label">{label}</p>
        <div className="flex items-start justify-between gap-2 mt-2">
          <div className="min-w-0 flex-1">
            <p className="kpi-value break-words">{value}</p>
            {sub && (
              <p className="text-[10px] text-on-surface-variant mt-1.5 leading-relaxed">{sub}</p>
            )}
          </div>
          {badge ? (
            <span className={badgeClass + ' shrink-0 self-start whitespace-nowrap'}>
              {badgeArrow}
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      {icon && (
        <div
          className="pointer-events-none absolute bottom-3 right-2 z-0 select-none opacity-[0.065]"
          aria-hidden
        >
          <span className="material-symbols-outlined block text-[2.875rem]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
      )}
    </div>
  );
}
