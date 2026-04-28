const COLORS = {
  CREATED: 'bg-slate-200 text-slate-700',
  IN_QUARANTINE: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PRODUCTION: 'bg-blue-100 text-blue-800',
  RELEASED: 'bg-teal-100 text-teal-800',
  SOLD: 'bg-indigo-100 text-indigo-800',
  RECALLED: 'bg-rose-100 text-rose-800',
  EXPIRED: 'bg-slate-300 text-slate-700',
  PASSED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  PENDING: 'bg-amber-100 text-amber-800',
};

export default function StatusBadge({ value }) {
  const cls = COLORS[value] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{value}</span>
  );
}
