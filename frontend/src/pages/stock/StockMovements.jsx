import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { stockService, productService } from '../../services/index.js';

export default function StockMovements() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => stockService.movements().then((r) => r.movements), []);
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', batchNumber: '', type: 'IN', quantity: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = { message: 'Product is required', show: true };
    if (!form.type) e.type = { message: 'Type is required', show: true };
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = { message: 'Quantity must be > 0', show: true };
    return e;
  };

  const submit = async () => {
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      await stockService.createMovement({ ...form, quantity: Number(form.quantity) });
      toast.success('Movement recorded');
      setOpen(false);
      setForm({ productId: '', batchNumber: '', type: 'IN', quantity: '', reason: '' });
      setErrors({});
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to record movement');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle="Inbound and outbound movements with full traceability."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>➕ Record Movement</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['batchNumber', 'productName', 'reason']}
        filters={[{ key: 'type', label: 'All types', options: [
          { value: 'IN', label: 'Entry' },
          { value: 'OUT', label: 'Exit' },
        ]}]}
        columns={[
          { key: 'createdAt',   header: 'Date',         sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleString() },
          { key: 'productName', header: 'Product',      sortable: true, render: (r) => r.productName || r.product?.name || '—' },
          { key: 'batchNumber', header: 'Batch #',      render: (r) => r.batchNumber ? <span className="font-mono text-primary">{r.batchNumber}</span> : '—' },
          { key: 'type',        header: 'Type',         render: (r) => <Badge status={r.type === 'IN' ? 'active' : 'pending'} label={r.type === 'IN' ? 'Entry' : 'Exit'} /> },
          { key: 'quantity',    header: 'Qty',          sortable: true, render: (r) => <span className="font-mono">{r.quantity}</span> },
          { key: 'reason',      header: 'Reason' },
          { key: 'user',        header: 'User',         render: (r) => r.user?.fullName || r.userName || '—' },
        ]}
        empty={{ icon: '🔄', title: 'No movements yet', message: 'Record your first stock movement to get started.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Record Movement</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title="Record Movement" onSubmit={submit} loading={saving} submitLabel="Record">
        <SelectField label="Product" name="productId" required value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          options={(products || []).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))}
          error={errors.productId}
        />
        <InputField label="Batch Number" name="batchNumber" value={form.batchNumber}
          onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
          hint="Leave empty for products without batch tracking"
        />
        <SelectField label="Type" name="type" required value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={[{ value: 'IN', label: 'Entry' }, { value: 'OUT', label: 'Exit' }]}
          error={errors.type}
        />
        <InputField label="Quantity" name="quantity" type="number" min="0" step="any" required
          value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          error={errors.quantity}
        />
        <InputField label="Reason" name="reason" value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
      </FormModal>
    </div>
  );
}
