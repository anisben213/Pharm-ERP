import { useEffect, useMemo, useState } from 'react';
import { productionService, productService, batchService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CAN_MANAGE = ['ADMIN', 'PRODUCTION_MANAGER'];

function CreateMOModal({ onClose, onCreated }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    productService.list().then((r) => {
      setProducts((r.products || []).filter((p) => p.type === 'FINISHED_PRODUCT'));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!productId || quantity <= 0) return setError('Pick a product and positive quantity');
    setSaving(true);
    try {
      await productionService.create({ productId, quantity: Number(quantity) });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">New Manufacturing Order</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Finished Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="">— Select —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to produce</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button disabled={saving} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create MO'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CompleteMOModal({ order, onClose, onCompleted }) {
  const [approvedBatches, setApprovedBatches] = useState([]);
  const [consumed, setConsumed] = useState([{ batchId: '', quantity: 0 }]);
  const [finishedBatchNumber, setFinishedBatchNumber] = useState(`FB-${Date.now()}`);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    batchService.list({ status: 'APPROVED' }).then((r) => setApprovedBatches(r.batches || []));
  }, []);

  const add = () => setConsumed((a) => [...a, { batchId: '', quantity: 0 }]);
  const upd = (i, patch) => setConsumed((a) => a.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const rm = (i) => setConsumed((a) => a.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!consumed.length || consumed.some((l) => !l.batchId || Number(l.quantity) <= 0)) {
      return setError('All consumed lines must have a batch + positive qty');
    }
    setSaving(true);
    try {
      await productionService.complete(order.id, {
        consumedBatches: consumed.map((l) => ({ batchId: l.batchId, quantity: Number(l.quantity) })),
        finishedBatchNumber: finishedBatchNumber || undefined,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      onCompleted();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Complete: {order.reference}</h3>
            <p className="text-xs text-slate-500">Producing {order.product?.name} × {order.quantity}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Finished batch #</label>
              <input value={finishedBatchNumber} onChange={(e) => setFinishedBatchNumber(e.target.value)} className="w-full border rounded px-3 py-2 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry date</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Consumed raw batches</span>
              <button type="button" onClick={add} className="text-sm text-blue-600 hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {consumed.map((l, i) => {
                const picked = approvedBatches.find((b) => b.id === l.batchId);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8">
                      <select value={l.batchId} onChange={(e) => upd(i, { batchId: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" required>
                        <option value="">— Approved batch —</option>
                        {approvedBatches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} · {b.product?.name} · avail {Number(b.remainingQty)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0.01" step="0.01" max={picked ? Number(picked.remainingQty) : undefined} value={l.quantity} onChange={(e) => upd(i, { quantity: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Qty" />
                    </div>
                    <div className="col-span-1">
                      {consumed.length > 1 && (
                        <button type="button" onClick={() => rm(i)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Each consumption decrements the source batch and creates a genealogy link → full traceability back from finished batch to raw materials.
            </p>
          </div>
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button disabled={saving} className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Completing…' : 'Complete production'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Production() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user?.role);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    productionService.list().then((r) => setOrders(r.orders || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    return orders.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.reference} ${r.product?.name || ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [orders, q, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Manufacturing Orders"
        subtitle="Transform raw materials into finished batches"
        actions={canManage && (
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            + New Manufacturing Order
          </button>
        )}
      />

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference / product" className="flex-1 min-w-[220px] border rounded px-3 py-1.5 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Order #</th>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-left px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Produced batches</th>
              <th className="text-left px-4 py-2">Started</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No manufacturing orders</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{r.reference}</td>
                <td className="px-4 py-2">{r.product?.name || '—'}</td>
                <td className="px-4 py-2">{r.quantity}</td>
                <td className="px-4 py-2"><StatusBadge value={r.status} /></td>
                <td className="px-4 py-2">
                  {(r.producedBatches || []).length
                    ? r.producedBatches.map((b) => (
                        <a key={b.id} href={`/batches/${b.id}`} className="text-xs font-mono text-blue-600 hover:underline mr-2">{b.batchNumber}</a>
                      ))
                    : <span className="text-slate-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-2 text-slate-500">{r.startedAt?.slice(0, 10) || '—'}</td>
                <td className="px-4 py-2">
                  {canManage && r.status !== 'COMPLETED' && (
                    <button onClick={() => setCompleteTarget(r)} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateMOModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {completeTarget && <CompleteMOModal order={completeTarget} onClose={() => setCompleteTarget(null)} onCompleted={() => { setCompleteTarget(null); load(); }} />}
    </div>
  );
}
