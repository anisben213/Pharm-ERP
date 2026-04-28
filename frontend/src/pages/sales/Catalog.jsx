import { useState, useMemo } from 'react';
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
  const [type, setType] = useState('');

  const stockMap = useMemo(() => {
    const m = new Map();
    (summary || []).forEach((s) => m.set(s.productId || s.id, Number(s.quantity ?? 0)));
    return m;
  }, [summary]);

  const finished = (products || []).filter((p) => p.type === 'FINISHED_PRODUCT');
  const filtered = finished.filter((p) =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()))
    && (!type || p.category === type)
  );

  const categories = Array.from(new Set(finished.map((p) => p.category).filter(Boolean)));

  return (
    <div>
      <PageHeader title="Product Catalog" subtitle="Finished products available for sale." />

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input className="input md:max-w-md" placeholder="🔍 Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input md:w-48" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <Skeleton lines={4} />
        : filtered.length === 0
          ? <div className="card"><EmptyState icon="📖" title="No products" message="No products match your search." /></div>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => {
                const stock = stockMap.get(p.id) ?? 0;
                const stockStatus = stock <= 0 ? 'rejected' : stock < 10 ? 'pending' : 'active';
                const stockLabel = stock <= 0 ? 'Out of stock' : `${stock} in stock`;
                return (
                  <div key={p.id} className="card">
                    <div className="aspect-video bg-gradient-to-br from-primary-50 to-slate-100 rounded-lg flex items-center justify-center text-5xl mb-3">💊</div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-ink-800">{p.name}</span>
                      <Badge status={stockStatus} label={stockLabel} />
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{p.category || p.type?.replace('_', ' ')}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400">{p.sku}</span>
                      <span className="font-semibold text-ink-800">{p.price ? `${Number(p.price).toFixed(2)} €` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );
}
