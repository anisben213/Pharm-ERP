import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { stockService, productService, batchService } from '../../services/index.js';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function StockDashboard() {
  const { data: products, loading: lp } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: summary, loading: ls } = useFetch(() => stockService.summary().then((r) => r.summary), []);
  const { data: expiring, loading: le } = useFetch(() => stockService.expiring(60).then((r) => r.batches), []);

  const totalProducts = products?.length ?? 0;
  const lowStock = (summary || []).filter((s) => Number(s.quantity ?? 0) <= Number(s.minLevel ?? 0)).length;
  const expiringCount = (expiring || []).length;
  const stockValue = (summary || []).reduce((acc, s) => acc + Number(s.value ?? 0), 0);

  return (
    <div>
      <PageHeader title="Stock Dashboard" subtitle="Overview of inventory health and alerts." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard icon="📦" label="Total Products"          value={totalProducts}  color="primary" loading={lp} />
        <KPICard icon="⚠️" label="Low Stock Alerts"        value={lowStock}        color="danger"  loading={ls} />
        <KPICard icon="⏳" label="Batches Expiring (60d)"  value={expiringCount}   color="warning" loading={le} />
        <KPICard icon="💰" label="Total Stock Value"       value={stockValue.toLocaleString(undefined,{maximumFractionDigits:0})} color="success" loading={ls} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-ink-800 mb-3">Low Stock</h3>
          {ls ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
            : (summary || []).filter((s) => Number(s.quantity ?? 0) <= Number(s.minLevel ?? 0)).length === 0
              ? <EmptyState icon="✅" title="All good" message="No products below minimum stock level." />
              : (
                <ul className="divide-y divide-slate-100">
                  {(summary || []).filter((s) => Number(s.quantity ?? 0) <= Number(s.minLevel ?? 0)).slice(0, 6).map((s, i) => (
                    <li key={i} className="py-2 flex items-center justify-between text-sm">
                      <span>{s.productName || s.name || 'Product'}</span>
                      <span className="text-danger font-medium">{s.quantity ?? 0} / {s.minLevel ?? 0}</span>
                    </li>
                  ))}
                </ul>
              )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-ink-800 mb-3">Expiring Soon</h3>
          {le ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
            : (expiring || []).length === 0
              ? <EmptyState icon="✅" title="No upcoming expiries" message="No batches expiring in the next 60 days." />
              : (
                <ul className="divide-y divide-slate-100">
                  {(expiring || []).slice(0, 6).map((b) => (
                    <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                      <span className="font-mono">{b.batchNumber}</span>
                      <span className="text-warning-600">{b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
        </div>
      </div>
    </div>
  );
}
