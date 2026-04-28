import { useEffect, useMemo, useState } from 'react';
import { salesService, customerService, batchService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CAN_MANAGE = ['ADMIN', 'SALES_AGENT'];

function CreateSOModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([{ batchId: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    customerService.list().then((r) => setCustomers(r.customers || []));
    batchService.list({ status: 'RELEASED' }).then((r) => setAvailableBatches(r.batches || []));
  }, []);

  const add = () => setLines((a) => [...a, { batchId: '', quantity: 1, unitPrice: 0 }]);
  const upd = (i, patch) => setLines((a) => a.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const rm = (i) => setLines((a) => a.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!customerId) return setError('Select a customer');
    if (!lines.length || lines.some((l) => !l.batchId || Number(l.quantity) <= 0)) {
      return setError('All lines need a batch and positive qty');
    }
    setSaving(true);
    try {
      await salesService.create({
        customerId,
        lines: lines.map((l) => ({
          batchId: l.batchId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice) || 0,
        })),
      });
      onCreated();
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
          <h3 className="font-semibold text-slate-800">New Sales Order</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="">— Select —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Lines (RELEASED batches only)</span>
              <button type="button" onClick={add} className="text-sm text-blue-600 hover:underline">+ Add line</button>
            </div>
            {!availableBatches.length && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-2">
                No RELEASED batches available. Quality/production must release finished batches before selling.
              </div>
            )}
            <div className="space-y-2">
              {lines.map((l, i) => {
                const b = availableBatches.find((x) => x.id === l.batchId);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select value={l.batchId} onChange={(e) => upd(i, { batchId: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" required>
                        <option value="">— Batch —</option>
                        {availableBatches.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.batchNumber} · {x.product?.name} · avail {Number(x.remainingQty)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0.01" step="0.01" max={b ? Number(b.remainingQty) : undefined} value={l.quantity} onChange={(e) => upd(i, { quantity: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Qty" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => upd(i, { unitPrice: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Unit price" />
                    </div>
                    <div className="col-span-1">
                      {lines.length > 1 && (
                        <button type="button" onClick={() => rm(i)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Each line is linked to a specific batch number → full distribution traceability for recall.
            </p>
          </div>
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button disabled={saving} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create SO'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Sales() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user?.role);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [q, setQ] = useState('');

  const load = () => {
    setLoading(true);
    salesService.list().then((r) => setOrders(r.orders || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => orders.filter((r) => {
    if (!q) return true;
    const hay = `${r.reference} ${r.customer?.name || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [orders, q]);

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        subtitle="Distribution with batch-level traceability"
        actions={canManage && (
          <button onClick={() => setShow(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            + New Sales Order
          </button>
        )}
      />

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference / customer" className="w-full border rounded px-3 py-1.5 text-sm" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Order #</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Batches</th>
              <th className="text-left px-4 py-2">Total</th>
              <th className="text-left px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No sales orders</td></tr>
            ) : filtered.map((r) => {
              const total = (r.lines || []).reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice || 0), 0);
              return (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{r.reference}</td>
                  <td className="px-4 py-2">{r.customer?.name}</td>
                  <td className="px-4 py-2"><StatusBadge value={r.status} /></td>
                  <td className="px-4 py-2">
                    {(r.lines || []).map((l) => (
                      <a key={l.id} href={`/batches/${l.batchId}`} className="text-xs font-mono text-blue-600 hover:underline mr-2">
                        {l.batch?.batchNumber}
                      </a>
                    ))}
                  </td>
                  <td className="px-4 py-2">{total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-slate-500">{r.createdAt?.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {show && <CreateSOModal onClose={() => setShow(false)} onCreated={() => { setShow(false); load(); }} />}
    </div>
  );
}
