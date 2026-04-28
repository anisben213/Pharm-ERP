import { useEffect, useMemo, useState } from 'react';
import { purchaseService, supplierService, productService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CAN_CREATE = ['ADMIN', 'PURCHASER'];

function CreatePOModal({ onClose, onCreated }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([supplierService.list(), productService.list()]).then(([s, p]) => {
      setSuppliers(s.suppliers || []);
      const raw = (p.products || []).filter((x) => x.type === 'RAW_MATERIAL' || x.type === 'PACKAGING');
      setProducts(raw);
    });
  }, []);

  const updateLine = (i, patch) => {
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((a) => [...a, { productId: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (i) => setLines((a) => a.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!supplierId) return setError('Select a supplier');
    if (!lines.length || lines.some((l) => !l.productId || l.quantity <= 0)) {
      return setError('All lines must have a product and positive quantity');
    }
    setSaving(true);
    try {
      await purchaseService.create({
        supplierId,
        lines: lines.map((l) => ({
          productId: l.productId,
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
          <h3 className="font-semibold text-slate-800">New Purchase Order</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="">— Select —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Lines</span>
              <button type="button" onClick={addLine} className="text-sm text-blue-600 hover:underline">+ Add line</button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <select value={l.productId} onChange={(e) => updateLine(i, { productId: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" required>
                      <option value="">— Product —</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0.01" step="0.01" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Qty" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Unit price" />
                  </div>
                  <div className="col-span-1">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button disabled={saving} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create PO'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Purchases() {
  const { user } = useAuth();
  const canCreate = CAN_CREATE.includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    purchaseService.list().then((r) => setRows(r.orders || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const receive = async (id) => {
    if (!window.confirm('Confirm reception? This creates raw-material batches in IN_QUARANTINE and stock-in movements.')) return;
    try {
      await purchaseService.receive(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.reference} ${r.supplier?.name || ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Raw materials & packaging procurement"
        actions={canCreate && (
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            + New Purchase Order
          </button>
        )}
      />

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference / supplier" className="flex-1 min-w-[220px] border rounded px-3 py-1.5 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Reference</th>
              <th className="text-left px-4 py-2">Supplier</th>
              <th className="text-left px-4 py-2">Lines</th>
              <th className="text-left px-4 py-2">Total</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Created</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No purchase orders</td></tr>
            ) : filtered.map((r) => {
              const total = (r.lines || []).reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice || 0), 0);
              const canReceive = canCreate && (r.status === 'CONFIRMED' || r.status === 'DRAFT');
              return (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{r.reference}</td>
                  <td className="px-4 py-2">{r.supplier?.name}</td>
                  <td className="px-4 py-2">{r.lines?.length || 0}</td>
                  <td className="px-4 py-2">{total.toFixed(2)}</td>
                  <td className="px-4 py-2"><StatusBadge value={r.status} /></td>
                  <td className="px-4 py-2 text-slate-500">{r.createdAt?.slice(0, 10)}</td>
                  <td className="px-4 py-2">
                    {canReceive && (
                      <button onClick={() => receive(r.id)} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">
                        Receive
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && <CreatePOModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
