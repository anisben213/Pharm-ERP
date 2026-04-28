const VARIANTS = {
  validated:    { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Validated' },
  approved:     { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Approved' },
  completed:    { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Completed' },
  delivered:    { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Delivered' },
  received:     { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Received' },
  paid:         { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Paid' },
  active:       { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Active' },
  pass:         { bg: 'bg-success-100',  text: 'text-success-600',  label: 'Pass' },

  rejected:     { bg: 'bg-danger-100',   text: 'text-danger-600',   label: 'Rejected' },
  failed:       { bg: 'bg-danger-100',   text: 'text-danger-600',   label: 'Failed' },
  fail:         { bg: 'bg-danger-100',   text: 'text-danger-600',   label: 'Fail' },
  cancelled:    { bg: 'bg-danger-100',   text: 'text-danger-600',   label: 'Cancelled' },
  critical:     { bg: 'bg-danger-100',   text: 'text-danger-600',   label: 'Critical' },
  inactive:     { bg: 'bg-danger-100',   text: 'text-danger-600',   label: 'Inactive' },

  pending:      { bg: 'bg-warning-100',  text: 'text-warning-600',  label: 'Pending' },
  awaiting:     { bg: 'bg-warning-100',  text: 'text-warning-600',  label: 'Awaiting' },
  expiring:     { bg: 'bg-warning-100',  text: 'text-warning-600',  label: 'Expiring' },
  major:        { bg: 'bg-warning-100',  text: 'text-warning-600',  label: 'Major' },

  blocked:      { bg: 'bg-slate-200',    text: 'text-slate-700',    label: 'Blocked' },
  draft:        { bg: 'bg-slate-200',    text: 'text-slate-700',    label: 'Draft' },
  minor:        { bg: 'bg-slate-200',    text: 'text-slate-700',    label: 'Minor' },

  recalled:     { bg: 'bg-purple-100',   text: 'text-purple-700',   label: 'Recalled' },

  in_progress:  { bg: 'bg-primary-100',  text: 'text-primary-700',  label: 'In Progress' },
  sent:         { bg: 'bg-primary-100',  text: 'text-primary-700',  label: 'Sent' },
  open:         { bg: 'bg-primary-100',  text: 'text-primary-700',  label: 'Open' },
  new:          { bg: 'bg-primary-100',  text: 'text-primary-700',  label: 'New' },
};

export default function Badge({ status, label, className = '' }) {
  const key = String(status || '').toLowerCase().replace(/\s+/g, '_');
  const v = VARIANTS[key] || { bg: 'bg-slate-100', text: 'text-slate-700', label: label || status || '—' };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide ${v.bg} ${v.text} ${className}`}
    >
      {label || v.label}
    </span>
  );
}
