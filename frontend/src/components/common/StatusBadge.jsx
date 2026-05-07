// Status badge — colored chips for batch/order/etc statuses.
const STYLES = {
  // Batch
  IN_PROGRESS: 'bg-primary-50 text-primary-700 border-primary-100',
  PENDING_QC: 'bg-warning-50 text-warning-700 border-warning-100',
  VALIDATED: 'bg-success-50 text-success-700 border-success-100',
  REJECTED: 'bg-danger-50 text-danger-700 border-danger-100',
  IN_PRODUCTION: 'bg-purple-50 text-purple-700 border-purple-100',
  // Manufacturing / purchase / sales status reuses many of the above.
  CLOSED: 'bg-success-50 text-success-700 border-success-100',
  SENT: 'bg-slate-100 text-slate-700 border-slate-200',
  RECEIVED: 'bg-success-50 text-success-700 border-success-100',
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  CONFIRMED: 'bg-primary-50 text-primary-700 border-primary-100',
  DELIVERED: 'bg-success-50 text-success-700 border-success-100',
  PREPARED: 'bg-warning-50 text-warning-700 border-warning-100',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-100',
  // Categories
  FINISHED_PRODUCT: 'bg-primary-50 text-primary-700 border-primary-100',
  RAW_MATERIAL: 'bg-purple-50 text-purple-700 border-purple-100',
  // Notif types
  INFO: 'bg-primary-50 text-primary-700 border-primary-100',
  SUCCESS: 'bg-success-50 text-success-700 border-success-100',
  WARNING: 'bg-warning-50 text-warning-700 border-warning-100',
  ERROR: 'bg-danger-50 text-danger-700 border-danger-100',
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  const s = String(status).toUpperCase();
  const cls = STYLES[s] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${cls} ${className}`}>
      {label}
    </span>
  );
}
