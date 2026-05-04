import { useMemo } from 'react';
import { Warehouse } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

const ZONES = [
  { key: 'quarantine',   label: 'Quarantine',      statuses: ['IN_QUARANTINE'],              color: 'bg-warning',  textColor: 'text-warning-700',  bg: 'bg-warning-50' },
  { key: 'approved',     label: 'Main Storage',     statuses: ['APPROVED', 'RELEASED'],       color: 'bg-success',  textColor: 'text-success-700',  bg: 'bg-success-50' },
  { key: 'production',   label: 'Production Floor', statuses: ['IN_PRODUCTION'],              color: 'bg-primary',  textColor: 'text-primary-700',  bg: 'bg-primary-50' },
  { key: 'blocked',      label: 'Blocked / Recall', statuses: ['RECALLED', 'REJECTED'],       color: 'bg-danger',   textColor: 'text-red-700',      bg: 'bg-red-50' },
  { key: 'dispatched',   label: 'Dispatched',       statuses: ['SOLD', 'EXPIRED'],            color: 'bg-slate-400', textColor: 'text-slate-600',   bg: 'bg-slate-50' },
];

export default function StorageLocations() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const batches = data || [];
  const total = batches.length || 1;

  const zones = useMemo(() =>
    ZONES.map((z) => {
      const items = batches.filter((b) => z.statuses.includes(b.status));
      const qty = items.reduce((s, b) => s + Number(b.remainingQty ?? 0), 0);
      return { ...z, count: items.length, qty };
    }),
    [batches]
  );

  if (loading) return <div><PageHeader title="Storage Locations" /><Skeleton lines={4} /></div>;

  return (
    <div>
      <PageHeader
        title="Storage Locations"
        subtitle={`${batches.length} active batches across all zones.`}
      />

      {batches.length === 0
        ? <div className="card"><EmptyState icon={<Warehouse size={40} />} title="No batches" message="No batches in the system yet." /></div>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((z) => {
              const pct = Math.round((z.count / total) * 100);
              return (
                <div key={z.key} className={`card border-l-4 ${z.color.replace('bg-', 'border-')}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-ink-800">{z.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${z.bg} ${z.textColor}`}>
                      {z.count} batch{z.count !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-ink-900 mb-1">
                    {z.qty.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                    <div className={`h-full ${z.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{pct}% of total batches</div>
                  <div className="mt-3 space-y-1">
                    {z.statuses.map((s) => {
                      const cnt = batches.filter((b) => b.status === s).length;
                      return cnt > 0
                        ? <div key={s} className="flex justify-between text-xs text-slate-600"><span>{s.replace(/_/g, ' ')}</span><span className="font-mono">{cnt}</span></div>
                        : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Summary table */}
      {batches.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold mb-3 text-ink-800">All Active Batches</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="label-xs pb-2">Batch #</th>
                <th className="label-xs pb-2">Product</th>
                <th className="label-xs pb-2">Status / Zone</th>
                <th className="label-xs pb-2 text-right">Remaining Qty</th>
              </tr>
            </thead>
            <tbody>
              {batches.slice(0, 20).map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="py-2 font-mono text-primary text-xs">{b.batchNumber}</td>
                  <td className="py-2 text-sm">{b.productName || b.product?.name || '—'}</td>
                  <td className="py-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{b.status?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-2 font-mono text-right">{Number(b.remainingQty ?? 0).toLocaleString()}</td>
                </tr>
              ))}
              {batches.length > 20 && (
                <tr><td colSpan={4} className="py-2 text-xs text-slate-400 text-center">+{batches.length - 20} more batches</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

