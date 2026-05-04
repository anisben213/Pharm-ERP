import { useState, useMemo } from 'react';
import { Package2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productService, stockService } from '../../services/index.js';

export default function ProductCatalog() {
  const { data: products, loading } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: summary } = useFetch(() => stockService.summary().then((r) => r.summary).catch(() => []), []);
  const [search, setSearch] = useState('');

  const stockMap = useMemo(() => {
    const m = new Map();
    (summary || []).forEach((s) => m.set(s.productId || s.id, Number(s.quantity ?? 0)));
    return m;
  }, [summary]);

  const finished = (products || []).filter((p) => p.type === 'FINISHED_PRODUCT');
  const filtered = finished.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Product Catalog" subtitle="Finished products available for sale." />

      <div className="mb-5">
        <input className="input md:max-w-md" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <Skeleton lines={4} />
        : filtered.length === 0
          ? <div className="card"><EmptyState icon={<Package2 size={40} />} title="No products" message="No products match your search." /></div>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => {
                const stock = stockMap.get(p.id) ?? 0;
                const stockStatus = stock <= 0 ? 'rejected' : 'active';
                const stockLabel  = stock <= 0 ? 'Out of stock' : `${stock} ${p.unit || 'units'} in stock`;
                const initials = p.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={p.id} className="card hover:shadow-md transition-shadow">
                    {/* Header strip */}
                    <div className="h-16 bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg mb-4 flex items-center px-4 gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>
                      <span className="text-white font-semibold text-sm truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{p.sku}</span>
                      <Badge status={stockStatus} label={stockLabel} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{p.unit ? `Unit: ${p.unit}` : ''}</span>
                      {p.price ? <span className="font-semibold text-ink-800">{Number(p.price).toFixed(2)}</span> : null}
                    </div>
                    {p.description && <p className="text-xs text-slate-400 mt-2 truncate">{p.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );
}
