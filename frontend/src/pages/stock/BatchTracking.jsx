import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Package, ShieldCheck, ArrowDownToLine, ShoppingCart, Truck, FileText, AlertOctagon } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { stockService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

const STEP_ICONS = {
  created: { I: Package, color: 'bg-primary-50 text-primary-700' },
  quality_validated: { I: ShieldCheck, color: 'bg-success-50 text-success-700' },
  quality_rejected: { I: AlertOctagon, color: 'bg-danger-50 text-danger-700' },
  stock_entry: { I: ArrowDownToLine, color: 'bg-success-50 text-success-700' },
  stock_exit: { I: ShoppingCart, color: 'bg-warning-50 text-warning-700' },
  sales: { I: FileText, color: 'bg-primary-50 text-primary-700' },
  delivered: { I: Truck, color: 'bg-purple-50 text-purple-700' },
};

export default function BatchTracking() {
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState(params.batchNumber ? decodeURIComponent(params.batchNumber) : '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (number) => {
    if (!number) return;
    setLoading(true);
    setData(null);
    try {
      const result = await stockService.trace(number);
      setData(result);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Batch not found');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (params.batchNumber) load(decodeURIComponent(params.batchNumber));
  }, [params.batchNumber]);

  const submit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/stock_manager/batch-tracking/${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card">
        <label className="label-xs block mb-2">Track a batch by number</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="e.g. LOT-2026-001 or RM-2026-002"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Trace</button>
        </div>
      </form>

      {loading && <div className="card text-sm text-slate-500">Loading…</div>}

      {!loading && data && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
            <div>
              <div className="label-xs">Batch Number</div>
              <div className="text-2xl font-semibold text-ink-800">{data.batch.batchNumber}</div>
              <div className="text-sm text-slate-500 mt-1">
                {data.batch.product?.name} · {data.batch.quantity} {data.batch.product?.unit}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={data.batch.status} />
              <div className="text-xs text-slate-500">
                Expiry: {data.batch.expiryDate ? new Date(data.batch.expiryDate).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-[10px] top-2 bottom-2 w-px bg-slate-200" />
            {(data.timeline || []).map((step, idx) => {
              const cfg = STEP_ICONS[step.type] || STEP_ICONS.created;
              const I = cfg.I;
              return (
                <div key={idx} className="relative pb-6 last:pb-0">
                  <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <I size={12} />
                  </div>
                  <div className="text-sm font-medium text-ink-800">{step.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(step.date).toLocaleString()}</div>
                  {step.detail && <div className="text-sm text-slate-600 mt-1">{step.detail}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !data && (
        <div className="card">
          <EmptyState icon="🔍" title="Trace any batch" message="Enter a batch number above to see its full lifecycle." />
        </div>
      )}
    </div>
  );
}
