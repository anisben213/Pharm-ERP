import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { stockService } from '../../services/index.js';

export default function Alerts() {
  const { data: summary, loading: ls } = useFetch(() => stockService.summary().then((r) => r.summary), []);
  const { data: expiring, loading: le } = useFetch(() => stockService.expiring(90).then((r) => r.batches), []);

  const low = (summary || []).filter((s) => Number(s.quantity ?? 0) <= Number(s.minLevel ?? 0));

  return (
    <div>
      <PageHeader title="Stock Alerts" subtitle="Critical items requiring your attention." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card border-l-4 border-danger">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">⚠️ Low Stock</h3>
            <Badge status="rejected" label={`${low.length}`} />
          </div>
          {ls
            ? <Skeleton lines={3} />
            : low.length === 0
              ? <EmptyState icon="✅" title="All clear" message="No products below minimum stock level." />
              : (
                <ul className="divide-y divide-slate-100">
                  {low.map((s, i) => (
                    <li key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink-800">{s.productName || s.name}</div>
                        <div className="text-xs text-slate-500">Min: {s.minLevel ?? 0}</div>
                      </div>
                      <span className="text-danger font-semibold font-mono">{s.quantity ?? 0}</span>
                    </li>
                  ))}
                </ul>
              )}
        </section>

        <section className="card border-l-4 border-warning">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">⏳ Expiring Batches</h3>
            <Badge status="pending" label={`${(expiring || []).length}`} />
          </div>
          {le
            ? <Skeleton lines={3} />
            : (expiring || []).length === 0
              ? <EmptyState icon="✅" title="No expiring batches" message="No batches expiring in the next 90 days." />
              : (
                <ul className="divide-y divide-slate-100">
                  {(expiring || []).map((b) => (
                    <li key={b.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-primary">{b.batchNumber}</div>
                        <div className="text-xs text-slate-500">{b.productName || b.product?.name}</div>
                      </div>
                      <span className="text-warning-600 text-sm font-medium">
                        {b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
        </section>
      </div>
    </div>
  );
}
