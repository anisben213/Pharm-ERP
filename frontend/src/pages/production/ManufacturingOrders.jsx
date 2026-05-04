import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Eye, Play, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { productionService, productService, userService, batchService } from '../../services/index.js';

export default function ManufacturingOrders() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: users } = useFetch(() => userService.list().then((r) => r.users).catch(() => []), []);
  const { data: batches } = useFetch(() => batchService.list({ status: 'APPROVED' }).then((r) => r.batches), []);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', plannedDate: '', operatorId: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Start confirmation
  const [startTarget, setStartTarget] = useState(null);
  // Complete modal
  const [completing, setCompleting] = useState(null);
  const [consumedLines, setConsumedLines] = useState([{ batchId: '', quantity: '' }]);
  const [expiryDate, setExpiryDate] = useState('');
  const [acting, setActing] = useState(false);

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

  const doStart = async () => {
    setActing(true);
    try {
      await productionService.start(startTarget.id);
      toast.success(`Order ${startTarget.reference} started`);
      setStartTarget(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to start order');
    } finally { setActing(false); }
  };

  const openComplete = (order) => {
    setCompleting(order);
    setConsumedLines([{ batchId: '', quantity: '' }]);
    setExpiryDate('');
  };

  const doComplete = async () => {
    const validLines = consumedLines.filter((l) => l.batchId && Number(l.quantity) > 0);
    if (validLines.length === 0) { toast.warning('Add at least one consumed batch'); return; }
    setActing(true);
    try {
      await productionService.complete(completing.id, {
        consumedBatches: validLines.map((l) => ({ batchId: l.batchId, quantity: Number(l.quantity) })),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      toast.success('Order completed and batch generated');
      setCompleting(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to complete order');
    } finally { setActing(false); }
  };

  return (
    <div>
      <PageHeader
        title="Manufacturing Orders"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Create Order</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['orderNumber', 'batchNumber', 'productName']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'PLANNED',     label: 'Planned' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'COMPLETED',   label: 'Completed' },
          { value: 'CANCELLED',   label: 'Cancelled' },
        ]}]}
        onRowClick={(r) => navigate(`/production_manager/orders/${r.id}`)}
        columns={[
          { key: 'reference',  header: 'Order #',     sortable: true, render: (r) => <span className="font-mono">{r.reference || r.id}</span> },
          { key: 'productName', header: 'Product',     render: (r) => r.productName || r.product?.name || '—' },
          { key: 'batchNumber', header: 'Batch #',     render: (r) => { const bn = r.producedBatches?.[0]?.batchNumber; return bn ? <span className="font-mono text-primary">{bn}</span> : '—'; } },
          { key: 'plannedDate', header: 'Planned',     sortable: true, render: (r) => r.plannedDate ? new Date(r.plannedDate).toLocaleDateString() : '—' },
          { key: 'status',      header: 'Status',      render: (r) => <Badge status={r.status} /> },
          { key: 'quantity',    header: 'Qty',         render: (r) => <span className="font-mono">{r.quantity}</span> },
        ]}
        actions={(r) => (
          <div className="flex gap-1 justify-center">
            <IconButton icon={<Eye size={15} />} title="View Detail" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/production_manager/orders/${r.id}`); }} />
            {r.status === 'PLANNED' && (
              <IconButton icon={<Play size={15} />} title="Start Production" color="success" onClick={(e) => { e.stopPropagation(); setStartTarget(r); }} />
            )}
            {r.status === 'IN_PROGRESS' && (
              <IconButton icon={<CheckCircle size={15} />} title="Close / Complete" color="primary" onClick={(e) => { e.stopPropagation(); openComplete(r); }} />
            )}
          </div>
        )}
        empty={{ icon: <ClipboardList size={40} />, title: 'No orders yet', message: 'Create your first manufacturing order.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Create Order</button> }}
      />

      {/* Create order modal */}
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

      {/* Start confirmation */}
      <ConfirmModal
        open={!!startTarget}
        onClose={() => setStartTarget(null)}
        title="Start Production"
        message={`Start manufacturing order ${startTarget?.reference}? Status will change to IN PROGRESS.`}
        confirmLabel="Start"
        loading={acting}
        onConfirm={doStart}
      />

      {/* Complete order modal */}
      <FormModal
        open={!!completing}
        onClose={() => setCompleting(null)}
        title={`Complete Order ${completing?.reference || ''}`}
        onSubmit={doComplete}
        loading={acting}
        submitLabel="Complete & Close"
        size="lg"
      >
        <p className="text-sm text-slate-600 mb-4">Record the raw materials consumed for this production run.</p>

        <div className="space-y-2">
          <div className="label-xs mb-1">Consumed Batches</div>
          {consumedLines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-8">
                <SelectField label={i === 0 ? 'Raw Material Batch' : ''} value={line.batchId}
                  onChange={(e) => setConsumedLines((ls) => ls.map((l, idx) => idx === i ? { ...l, batchId: e.target.value } : l))}
                  options={(batches || []).map((b) => ({ value: b.id, label: `${b.batchNumber} — ${b.product?.name || ''} (qty: ${Number(b.remainingQty)})` }))}
                />
              </div>
              <div className="col-span-3">
                <InputField label={i === 0 ? 'Qty used' : ''} type="number" min="0" step="any" value={line.quantity}
                  onChange={(e) => setConsumedLines((ls) => ls.map((l, idx) => idx === i ? { ...l, quantity: e.target.value } : l))}
                />
              </div>
              <div className="col-span-1 pb-4">
                {consumedLines.length > 1 && <button type="button" className="text-danger text-lg font-bold cursor-pointer" onClick={() => setConsumedLines((ls) => ls.filter((_, idx) => idx !== i))}>×</button>}
              </div>
            </div>
          ))}
          <button type="button" className="btn-outline text-sm mt-1" onClick={() => setConsumedLines((ls) => [...ls, { batchId: '', quantity: '' }])}><Plus size={14} /> Add batch</button>
        </div>

        <InputField label="Expiry Date (optional)" type="date" value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          hint="Leave blank to set later via batch management"
        />
      </FormModal>
    </div>
  );
}
