export default function KPICard({ icon = '📊', label, value, trend, trendValue, color = 'primary', loading = false }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    danger:  'bg-danger-50 text-danger-600',
    warning: 'bg-warning-50 text-warning-600',
    purple:  'bg-purple-50 text-purple-700',
    gray:    'bg-slate-100 text-slate-600',
  };
  const trendColor = trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-slate-500';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className="card relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="label-xs mb-1">{label}</div>
          {loading
            ? <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            : <div className="text-2xl font-semibold text-ink-800 leading-tight">{value ?? '—'}</div>}
        </div>
      </div>
      {trendValue != null && (
        <div className={`absolute right-4 bottom-3 text-xs font-medium ${trendColor}`}>
          {trendArrow} {trendValue}
        </div>
      )}
    </div>
  );
}
