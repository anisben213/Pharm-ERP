import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState.jsx';
import { stockService } from '../../services/index.js';

export default function Alerts() {
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setAlerts(await stockService.alerts()); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="card">
        <header className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-lg font-semibold text-ink-800">Low Stock</h3>
          <span className="ml-auto text-sm text-slate-500">{alerts.lowStock?.length || 0}</span>
        </header>
        {loading ? <div className="text-sm text-slate-500">Loading…</div>
          : (alerts.lowStock || []).length === 0
            ? <EmptyState icon="✅" title="All good" message="All products are above minimum stock level." />
            : (
              <ul className="divide-y divide-slate-100">
                {alerts.lowStock.map((p) => (
                  <li key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-ink-800">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {p.category === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Product'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-danger-700">{p.currentStock} {p.unit}</div>
                      <div className="text-xs text-slate-500">min {p.minStockLevel}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
      </section>

      <section className="card">
        <header className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <h3 className="text-lg font-semibold text-ink-800">Expiring Within 30 Days</h3>
          <span className="ml-auto text-sm text-slate-500">{alerts.expiring?.length || 0}</span>
        </header>
        {loading ? <div className="text-sm text-slate-500">Loading…</div>
          : (alerts.expiring || []).length === 0
            ? <EmptyState icon="⏱️" title="Nothing expiring soon" message="No batches expire in the next 30 days." />
            : (
              <ul className="divide-y divide-slate-100">
                {alerts.expiring.map((b) => (
                  <li key={b.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/stock_manager/batch-tracking/${encodeURIComponent(b.batchNumber)}`}
                        className="text-sm font-medium text-primary hover:underline">{b.batchNumber}</Link>
                      <div className="text-xs text-slate-500">{b.product?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-warning-700">
                        {new Date(b.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">{b.quantity} {b.product?.unit}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
      </section>
    </div>
  );
}
