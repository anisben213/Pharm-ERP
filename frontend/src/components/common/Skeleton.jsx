export default function Skeleton({ className = '', lines = 1, height = 'h-4' }) {
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`bg-slate-200 rounded animate-pulse ${height}`} style={{ width: `${100 - i * 8}%` }} />
        ))}
      </div>
    );
  }
  return <div className={`bg-slate-200 rounded animate-pulse ${height} ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="grid bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="px-4 py-3"><Skeleton height="h-3" /></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid border-b border-slate-100" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="px-4 py-4"><Skeleton /></div>
          ))}
        </div>
      ))}
    </div>
  );
}
