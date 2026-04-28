import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService, batchService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const MOVEMENT_TYPES = [
  'IN_PURCHASE',
  'IN_PRODUCTION',
  'OUT_PRODUCTION',
  'OUT_SALES',
  'ADJUSTMENT',
  'RECALL',
];

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Stock() {
  const { user } = useAuth();
  const nav = useNavigate();
  const canWrite = ['ADMIN', 'STOCK_MANAGER'].includes(user?.role);
  const canBlock = ['ADMIN', 'QUALITY_CONTROLLER', 'STOCK_MANAGER'].includes(user?.role);

  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ type: '', search: '', from: '', to: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ batchId: '', type: 'IN_PURCHASE', quantity: '', reference: '', note: '' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    Promise.all([
      stockService.movements(Object.keys(params).length ? params : undefined).then((d) => setMovements(d.movements || [])),
      stockService.summary().then((d) => setSummary(d.summary || [])).catch(() => setSummary([])),
      stockService.expiring(90).then((d) => setExpiring(d.batches || [])).catch(() => setExpiring([])),
      batchService.list().then((d) => setBatches(d.batches || [])).catch(() => setBatches([])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.type, filters.from, filters.to]);

  const filteredMovements = useMemo(() => {
    const s = filters.search.trim().toLowerCase();
    if (!s) return movements;
    return movements.filter((m) =>
      m.batch?.batchNumber?.toLowerCase().includes(s) ||
      m.batch?.product?.name?.toLowerCase().includes(s) ||
      m.batch?.product?.sku?.toLowerCase().includes(s) ||
      m.reference?.toLowerCase().includes(s) ||
      m.note?.toLowerCase().includes(s)
    );
  }, [movements, filters.search]);

  const stockByProduct = useMemo(() => {
    const map = {};
    summary.forEach((s) => {
      const key = s.product?.id || s.productId;
      if (!map[key]) map[key] = { product: s.product, total: 0, byStatus: {} };
      map[key].total += s.quantity;
      map[key].byStatus[s.status] = (map[key].byStatus[s.status] || 0) + s.quantity;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [summary]);

  const submitMovement = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await stockService.createMovement({
        batchId: form.batchId,
        type: form.type,
        quantity: Number(form.quantity),
        reference: form.reference || undefined,
        note: form.note || undefined,
      });
      setModalOpen(false);
      setForm({ batchId: '', type: 'IN_PURCHASE', quantity: '', reference: '', note: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record movement');
    }
  };

  const blockBatch = async (batchId) => {
    if (!window.confirm('Block this batch? It will be marked REJECTED.')) return;
    try {
      await stockService.blockBatch(batchId);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block batch');
    }
  };

  const columns = [
    { key: 'createdAt', label: 'Date', render: (r) => r.createdAt?.slice(0, 16).replace('T', ' ') },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          r.type.startsWith('IN') ? 'bg-emerald-100 text-emerald-800' :
          r.type === 'RECALL' ? 'bg-red-100 text-red-800' :
          r.type === 'ADJUSTMENT' ? 'bg-amber-100 text-amber-800' :
          'bg-slate-100 text-slate-700'
        }`}>{r.type}</span>
      ),
    },
    {
      key: 'batch',
      label: 'Batch #',
      render: (r) => (
        <button onClick={() => nav(`/batches/${r.batchId}`)} className="text-blue-600 hover:underline">
          {r.batch?.batchNumber}
        </button>
      ),
    },
    { key: 'product', label: 'Product', render: (r) => r.batch?.product?.name || '—' },
    { key: 'quantity', label: 'Quantity', render: (r) => `${Number(r.quantity)} ${r.batch?.product?.unit || ''}` },
    { key: 'reference', label: 'Reference', render: (r) => r.reference || '—' },
  ];

  return (
    <div>
      <PageHeader title="Stock Management" subtitle="Inventory, movements, expiry & batch blocking">
        {canWrite && (
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            + Record Movement
          </button>
        )}
      </PageHeader>

      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <h2 className="font-semibold mb-3 flex items-center justify-between">
          <span>Stock Levels by Product</span>
          <span className="text-xs text-slate-500 font-normal">{stockByProduct.length} products</span>
        </h2>
        {stockByProduct.length === 0 ? (
          <div className="text-slate-500 text-sm">No data.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockByProduct.map((s) => (
              <div key={s.product?.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{s.product?.name}</div>
                    <div className="text-xs text-slate-500">{s.product?.sku} · {s.product?.type}</div>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {s.total.toFixed(0)}{' '}
                    <span className="text-xs font-normal text-slate-500">{s.product?.unit}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(s.byStatus).map(([st, q]) => (
                    <span key={st} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {st}: {q.toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-2 text-amber-900">⚠ Expiring soon (next 90 days) — {expiring.length} batch(es)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-amber-900">
                  <th className="py-1">Batch #</th>
                  <th>Product</th>
                  <th>Remaining</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expiring.slice(0, 10).map((b) => (
                  <tr key={b.id} className="border-t border-amber-200">
                    <td className="py-1">
                      <button onClick={() => nav(`/batches/${b.id}`)} className="text-blue-600 hover:underline">
                        {b.batchNumber}
                      </button>
                    </td>
                    <td>{b.product?.name}</td>
                    <td>{Number(b.remainingQty)}</td>
                    <td className="font-medium">{b.expiryDate?.slice(0, 10)}</td>
                    <td><StatusBadge value={b.status} /></td>
                    <td>
                      {canBlock && (
                        <button onClick={() => blockBatch(b.id)} className="text-red-600 text-xs hover:underline">
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Batch, product, SKU, reference…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm w-64"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">All types</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => setFilters({ type: '', search: '', from: '', to: '' })}
          className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5"
        >
          Clear
        </button>
        <div className="ml-auto text-sm text-slate-500">{filteredMovements.length} movement(s)</div>
      </div>

      {loading ? <div>Loading…</div> : <Table columns={columns} rows={filteredMovements} />}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(''); }} title="Record Stock Movement">
        <form onSubmit={submitMovement} className="space-y-3">
          {error && <div className="bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm mb-1">Batch *</label>
            <select
              required
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">— Select batch —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} · {b.product?.name} (remaining {Number(b.remainingQty)})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Type *</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Quantity *</label>
              <input
                required
                type="number"
                min="0.0001"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Reference</label>
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="PO/SO/MO number…"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows="2"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
