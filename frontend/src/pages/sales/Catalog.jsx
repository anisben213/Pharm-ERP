import { useEffect, useState } from 'react';
import { Package, Calendar } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState.jsx';
import { productService } from '../../services/index.js';

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await productService.catalog()); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="card text-sm text-slate-500">Loading catalog…</div>;

  if (items.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="📦" title="Catalog empty" message="No finished products with validated stock." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p) => (
        <div key={p.id} className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-ink-800 truncate">{p.name}</div>
              <div className="text-xs text-slate-500">Available stock</div>
              <div className="text-xl font-semibold text-success-700 mt-0.5">
                {p.availableQuantity} <span className="text-sm font-normal text-slate-500">{p.unit}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Calendar size={12} /> Earliest expiry:{' '}
            <span className="font-medium text-ink-800">
              {p.earliestExpiry ? new Date(p.earliestExpiry).toLocaleDateString() : '—'}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <div className="label-xs mb-1">Batches</div>
            <div className="space-y-1">
              {(p.batches || []).slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-primary font-medium">{b.batchNumber}</span>
                  <span className="text-slate-500">{b.quantity} {p.unit}</span>
                </div>
              ))}
              {(p.batches || []).length > 3 && (
                <div className="text-xs text-slate-400">+{p.batches.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
