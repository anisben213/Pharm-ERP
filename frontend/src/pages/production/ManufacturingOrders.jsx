import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { productionService, productService, userService } from '../../services/index.js';

export default function ManufacturingOrders() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: users } = useFetch(() => userService.list().then((r) => r.users).catch(() => []), []);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', plannedDate: '', operatorId: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = { message: 'Product is required', show: true };
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = { message: 'Quantity must be > 0', show: true };
    if (!form.plannedDate) e.plannedDate = { message: 'Planned date is required', show: true };
    return e;
  };

  const submit = async () => {
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      const created = await productionService.create({ ...form, quantity: Number(form.quantity) });
      toast.success(created.batchNumber ? `Order created — Batch ${created.batchNumber}` : 'Order created');
      setOpen(false);
      setForm({ productId: '', quantity: '', plannedDate: '', operatorId: '' });
      setErrors({});
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create order');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Manufacturing Orders"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>➕ Create Order</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['orderNumber', 'batchNumber', 'productName']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ]}]}
        onRowClick={(r) => navigate(`/production_manager/orders/${r.id}`)}
        columns={[
          { key: 'orderNumber', header: 'Order #',     sortable: true, render: (r) => <span className="font-mono">{r.orderNumber || r.id}</span> },
          { key: 'productName', header: 'Product',     render: (r) => r.productName || r.product?.name || '—' },
          { key: 'batchNumber', header: 'Batch #',     render: (r) => r.batchNumber ? <span className="font-mono text-primary">{r.batchNumber}</span> : '—' },
          { key: 'plannedDate', header: 'Planned',     sortable: true, render: (r) => r.plannedDate ? new Date(r.plannedDate).toLocaleDateString() : '—' },
          { key: 'status',      header: 'Status',      render: (r) => <Badge status={r.status} /> },
          { key: 'quantity',    header: 'Qty',         render: (r) => <span className="font-mono">{r.quantity}</span> },
        ]}
        actions={(r) => (
          <>
            <IconButton icon="👁" title="View" color="primary" onClick={() => navigate(`/production_manager/orders/${r.id}`)} />
          </>
        )}
        empty={{ icon: '📋', title: 'No orders yet', message: 'Create your first manufacturing order.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Create Order</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title="Create Manufacturing Order" onSubmit={submit} loading={saving} submitLabel="Create">
        <SelectField label="Product" name="productId" required value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          options={(products || []).filter((p) => p.type === 'FINISHED_PRODUCT').map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))}
          error={errors.productId}
        />
        <InputField label="Quantity" name="quantity" type="number" min="0" required
          value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          error={errors.quantity}
        />
        <InputField label="Planned Date" name="plannedDate" type="date" required
          value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
          error={errors.plannedDate}
        />
        <SelectField label="Assigned Operator" name="operatorId" value={form.operatorId}
          onChange={(e) => setForm({ ...form, operatorId: e.target.value })}
          options={(users || []).map((u) => ({ value: u.id, label: u.fullName || u.email }))}
        />
        <p className="text-xs text-slate-500">Batch number will be auto-generated on creation.</p>
      </FormModal>
    </div>
  );
}
