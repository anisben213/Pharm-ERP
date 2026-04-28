import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { stockService, productService } from '../../services/index.js';

export default function RecordMovement() {
  const toast = useToast();
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: recent, loading: lr, refetch } = useFetch(() => stockService.movements({ limit: 10 }).then((r) => r.movements), []);

  const [form, setForm] = useState({ productId: '', batchNumber: '', type: 'IN', quantity: '', reason: '', location: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = { message: 'Product is required', show: true };
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = { message: 'Quantity must be > 0', show: true };
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      await stockService.createMovement({ ...form, quantity: Number(form.quantity) });
      toast.success('Movement recorded successfully');
      setForm({ productId: '', batchNumber: '', type: 'IN', quantity: '', reason: '', location: '' });
      setErrors({});
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record movement');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Record Movement" subtitle="Log incoming or outgoing stock with full traceability." />

      <form onSubmit={submit} className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <SelectField label="Product" name="productId" required value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            options={(products || []).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))}
            error={errors.productId}
          />
          <InputField label="Batch Number" name="batchNumber" value={form.batchNumber}
            onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
            placeholder="Auto or manual"
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Type <span className="text-danger">*</span></label>
            <div className="flex gap-2">
              {[
                { v: 'IN', l: '↓ Entry', cls: 'success' },
                { v: 'OUT', l: '↑ Exit', cls: 'danger' },
              ].map((t) => (
                <button
                  key={t.v} type="button"
                  onClick={() => setForm({ ...form, type: t.v })}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm cursor-pointer transition-all ${
                    form.type === t.v
                      ? t.cls === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
                      : 'bg-slate-100 text-ink-800 hover:bg-slate-200'
                  }`}
                >{t.l}</button>
              ))}
            </div>
          </div>
          <InputField label="Quantity" name="quantity" type="number" min="0" step="any" required
            value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            error={errors.quantity}
          />
          <SelectField label="Location" name="location" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            options={['Warehouse A', 'Warehouse B', 'Cold Storage', 'Quarantine']}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Reason</label>
            <textarea
              className="input min-h-[80px]"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Receipt of PO-2026-014"
            />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button type="submit" className="btn-primary text-base px-6 py-3" disabled={saving}>
            {saving ? 'Recording…' : '✓ Record Movement'}
          </button>
        </div>
      </form>

      <h3 className="font-semibold text-ink-800 mb-3">Recent Movements</h3>
      <Table
        loading={lr}
        data={recent || []}
        searchKeys={['batchNumber', 'productName']}
        pageSize={5}
        columns={[
          { key: 'createdAt',   header: 'Date',    render: (r) => new Date(r.createdAt || r.date).toLocaleString() },
          { key: 'productName', header: 'Product', render: (r) => r.productName || r.product?.name || '—' },
          { key: 'batchNumber', header: 'Batch #', render: (r) => r.batchNumber ? <span className="font-mono text-primary">{r.batchNumber}</span> : '—' },
          { key: 'type',        header: 'Type',    render: (r) => <Badge status={r.type === 'IN' ? 'active' : 'pending'} label={r.type === 'IN' ? 'Entry' : 'Exit'} /> },
          { key: 'quantity',    header: 'Qty' },
        ]}
        empty={{ icon: '🔄', title: 'No movements yet', message: 'Use the form above to record your first movement.' }}
      />
    </div>
  );
}
