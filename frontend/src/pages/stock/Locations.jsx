import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService, productService } from '../../services/index.js';

const STATUS_COLOR = {
  APPROVED:      'bg-success-100 text-success-700 border-success-200',
  RELEASED:      'bg-primary-100 text-primary-700 border-primary-200',
  IN_PRODUCTION: 'bg-warning-100 text-warning-700 border-warning-200',
  IN_QUARANTINE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CREATED:       'bg-slate-100 text-slate-600 border-slate-200',
};

export default function StockLocations() {
  const { data: batches, loading: bLoading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const { data: products, loading: pLoading } = useFetch(() => productService.list().then((r) => r.products), []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loading = bLoading || pLoading;

  const productMap = useMemo(() => {
    const m = new Map();
    (products || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  // Group active batches by product
  const ACTIVE = ['CREATED', 'IN_QUARANTINE', 'APPROVED', 'IN_PRODUCTION', 'RELEASED'];
  const grouped = useMemo(() => {
    const map = {};
    for (const b of (batches || [])) {
      if (!ACTIVE.includes(b.status)) continue;
      if (filterStatus && b.status !== filterStatus) continue;
      const p = productMap.get(b.productId);
      const key = b.productId;
      if (!map[key]) map[key] = { product: p, batches: [] };
      map[key].batches.push(b);
    }
    return Object.values(map).filter(({ product }) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return product?.name?.toLowerCase().includes(q) || product?.sku?.toLowerCase().includes(q);
    });
  }, [batches, productMap, search, filterStatus]);

  return (
    <div>
      <PageHeader
        title="Stock Locations"
        subtitle="Batch inventory by product — active batches with remaining quantities."
      />

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          className="input md:max-w-sm"
          placeholder="Search by product name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input md:w-48" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ACTIVE.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <Skeleton lines={6} /> : grouped.length === 0
        ? (
          <div className="card">
            <EmptyState icon={<MapPin size={40} />} title="No stock found" message="No active batches match your search." />
          </div>
        )
        : (
          <div className="space-y-4">
            {grouped.map(({ product, batches: pBatches }) => {
              const totalQty = pBatches.reduce((s, b) => s + Number(b.remainingQty || 0), 0);
              return (
                <div key={product?.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-ink-800">{product?.name || '—'}</span>
                      <span className="ml-2 font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{product?.sku}</span>
                    </div>
                    <div className="text-sm font-semibold text-ink-800">
                      Total: {totalQty.toLocaleString()} {product?.unit || ''}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="label-xs px-3 py-2">Batch #</th>
                          <th className="label-xs px-3 py-2">Status</th>
                          <th className="label-xs px-3 py-2">Remaining</th>
                          <th className="label-xs px-3 py-2">Initial Qty</th>
                          <th className="label-xs px-3 py-2">Expiry</th>
                          <th className="label-xs px-3 py-2">Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pBatches.map((b) => {
                          const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
                          const daysLeft = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null;
                          const expiryClass = daysLeft !== null && daysLeft <= 30 ? 'text-danger font-semibold' : daysLeft !== null && daysLeft <= 90 ? 'text-warning-600' : '';
                          return (
                            <tr key={b.id} className="border-t border-slate-100">
                              <td className="px-3 py-2 font-mono text-xs">{b.batchNumber}</td>
                              <td className="px-3 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[b.status] || 'bg-slate-100 text-slate-600'}`}>
                                  {b.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-semibold">{Number(b.remainingQty || 0).toLocaleString()}</td>
                              <td className="px-3 py-2 text-slate-500">{Number(b.quantity || 0).toLocaleString()}</td>
                              <td className={`px-3 py-2 ${expiryClass}`}>
                                {expiry ? expiry.toLocaleDateString() : '—'}
                                {daysLeft !== null && daysLeft <= 30 && <span className="ml-1 text-xs">({daysLeft}d)</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
