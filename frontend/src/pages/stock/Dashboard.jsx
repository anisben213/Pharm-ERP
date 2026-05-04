import { useMemo } from 'react';
import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Package, AlertTriangle, Clock, XCircle, CheckCircle, ShieldOff } from 'lucide-react';
import { stockService, productService, batchService } from '../../services/index.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Link } from 'react-router-dom';

export default function StockDashboard() {
  const { data: products, loading: lp } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: summary,  loading: ls } = useFetch(() => stockService.summary().then((r) => r.summary), []);
  const { data: expiring, loading: le } = useFetch(() => stockService.expiring(60).then((r) => r.batches), []);
  const { data: movs,     loading: lm } = useFetch(() => stockService.movements().then((r) => r.movements), []);
  const { data: batchList,loading: lb } = useFetch(() => batchService.list().then((r) => r.batches), []);

  const allSummary  = summary   || [];
  const allExpiring = expiring  || [];
  const allMovs     = movs      || [];
  const allBatches  = batchList || [];

  const lowStock   = allSummary.filter((s) => { const q = Number(s.quantity ?? 0); const m = Number(s.minLevel ?? 0); return q > 0 && q <= m; }).length;
  const outOfStock = allSummary.filter((s) => Number(s.quantity ?? 0) <= 0).length;
  const totalQty   = allSummary.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0);
  const blocked    = allBatches.filter((b) => b.status === 'RECALLED' || b.status === 'REJECTED').length;

  const recentMovs = useMemo(() =>
    [...allMovs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6),
    [allMovs]
  );

  const categories = useMemo(() => {
    const map = {};
    for (const s of allSummary) {
      const cat = s.category || 'Other';
      if (!map[cat]) map[cat] = 0;
      map[cat] += Number(s.quantity ?? 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [allSummary]);
  const maxCatQty = categories[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Dashboard" subtitle="Overview of inventory health and alerts." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={<Package size={22} />}       label="Total Products"        value={products?.length ?? 0}          color="primary" loading={lp} />
        <div className={lowStock > 0 ? 'ring-2 ring-warning rounded-xl' : ''}>
          <KPICard icon={<AlertTriangle size={22} />} label="Low Stock"           value={lowStock}                       color="warning" loading={ls} />
        </div>
        <div className={outOfStock > 0 ? 'ring-2 ring-danger rounded-xl' : ''}>
          <KPICard icon={<XCircle size={22} />}      label="Out of Stock"         value={outOfStock}                     color="danger"  loading={ls} />
        </div>
        <KPICard icon={<Clock size={22} />}           label="Expiring (60d)"       value={allExpiring.length}             color="orange"  loading={le} />
        <KPICard icon={<ShieldOff size={22} />}       label="Blocked / Recalled"   value={blocked}                        color="purple"  loading={lb} />
        <KPICard icon={<Package size={22} />}         label="Total Units in Stock" value={totalQty.toLocaleString()}      color="slate"   loading={ls} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Low Stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Low Stock / Out of Stock</h3>
            <Link to="/stock_manager/movements" className="text-xs text-primary hover:underline">Movements →</Link>
          </div>
          {ls ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
            : allSummary.filter((s) => { const q = Number(s.quantity ?? 0); return q >= 0 && q <= Number(s.minLevel ?? 0); }).length === 0
              ? <EmptyState icon={<CheckCircle size={40} />} title="All good" message="No products at or below minimum stock level." />
              : (
                <ul className="divide-y divide-slate-100">
                  {allSummary
                    .filter((s) => { const q = Number(s.quantity ?? 0); const m = Number(s.minLevel ?? 0); return q >= 0 && q <= m; })
                    .sort((a, b) => Number(a.quantity) - Number(b.quantity))
                    .slice(0, 8)
                    .map((s, i) => {
                      const qty = Number(s.quantity ?? 0);
                      const min = Number(s.minLevel ?? 0);
                      const isOut = qty <= 0;
                      return (
                        <li key={i} className="py-2 flex items-center justify-between text-sm gap-2">
                          <div>
                            <span className="font-medium">{s.productName || s.name || 'Product'}</span>
                            <span className="text-xs text-slate-400 ml-2">{s.sku}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={isOut ? 'text-danger font-bold' : 'text-warning-600 font-medium'}>
                              {qty} {s.unit}
                            </span>
                            <span className="text-xs text-slate-400">/ min {min}</span>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
        </div>

        {/* Expiring Soon */}
        <div className="card">
          <h3 className="font-semibold text-ink-800 mb-3">Expiring Soon (60 days)</h3>
          {le ? <div className="h-24 bg-slate-100 rounded animate-pulse" />
            : allExpiring.length === 0
              ? <EmptyState icon={<CheckCircle size={40} />} title="No upcoming expiries" message="No batches expiring in the next 60 days." />
              : (
                <ul className="divide-y divide-slate-100">
                  {allExpiring.slice(0, 8).map((b) => (
                    <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-mono">{b.batchNumber}</span>
                        <span className="text-xs text-slate-400 ml-2">{b.productName || b.product?.name}</span>
                      </div>
                      <span className="text-warning-600">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
        </div>

        {/* Recent Movements */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Recent Movements</h3>
            <Link to="/stock_manager/movements" className="text-xs text-primary hover:underline">All →</Link>
          </div>
          {lm ? <Skeleton lines={5} />
            : recentMovs.length === 0
              ? <p className="text-sm text-slate-400 py-4 text-center">No stock movements yet.</p>
              : (
                <div className="divide-y divide-slate-100">
                  {recentMovs.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <p className="font-medium">{m.productName || '—'}</p>
                        <p className="text-xs text-slate-400 font-mono">{m.batchNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${m.typeGroup === 'IN' ? 'text-success' : 'text-danger'}`}>
                          {m.typeGroup === 'IN' ? '+' : '−'}{m.quantity}
                        </span>
                        <p className="text-xs text-slate-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>

      {/* Stock by Category */}
      {categories.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-ink-800 mb-4">Stock by Category</h3>
          {ls ? <Skeleton lines={4} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {categories.map(([cat, qty]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span className="capitalize">{String(cat).toLowerCase().replace(/_/g, ' ')}</span>
                    <span>{qty.toLocaleString()} units</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${(qty / maxCatQty) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
