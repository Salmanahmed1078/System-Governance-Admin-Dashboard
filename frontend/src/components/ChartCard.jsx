export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="chart-card relative flex min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-primary font-headline">{title}</h3>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="relative z-0 min-h-0 w-full max-w-full flex-1">{children}</div>
    </div>
  );
}
