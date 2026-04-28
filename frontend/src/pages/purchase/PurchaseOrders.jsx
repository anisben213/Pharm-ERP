import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { purchaseService, supplierService, productService } from '../../services/index.js';

const STEPS = ['Sent', 'In Progress', 'Received'];

function statusStep(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'received') return 2;
  if (v === 'in_progress') return 1;
  return 0;
}

export default function PurchaseOrders() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => purchaseService.list().then((r) => r.orders), []);
  const { data: suppliers } = useFetch(() => supplierService.list().then((r) => r.suppliers).catch(() => []), []);
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: '', unitPrice: '' }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const total = lines.reduce((acc, l) => acc + (Number(l.quantity || 0) * Number(l.unitPrice || 0)), 0);

  const addLine = () => setLines((ls) => [...ls, { productId: '', quantity: '', unitPrice: '' }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async () => {
    const e = {};
    if (!supplierId) e.supplier = { message: 'Supplier is required', show: true };
    const validLines = lines
      .filter((l) => l.productId && Number(l.quantity) > 0)
      .map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice || 0) }));
    if (validLines.length === 0) e.lines = { message: 'Add at least one product', show: true };
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await purchaseService.create({ supplierId, lines: validLines });
      toast.success('Purchase order generated');
      setOpen(false);
      setSupplierId(''); setLines([{ productId: '', quantity: '', unitPrice: '' }]); setErrors({});
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    } finally { setSaving(false); }
  };

  const receive = async (id) => {
    try {
      await purchaseService.receive(id);
      toast.success('Order marked as received');
      refetch();
    } catch (e) {
      toast.error('Failed to mark as received');
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>➕ Generate Order</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['orderNumber', 'supplierName']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'sent', label: 'Sent' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'received', label: 'Received' },
        ]}]}
        onRowClick={(r) => setExpanded((e) => (e === r.id ? null : r.id))}
        columns={[
          { key: 'orderNumber',  header: 'Order #',  render: (r) => <span className="font-mono">{r.orderNumber || r.id}</span> },
          { key: 'supplierName', header: 'Supplier', render: (r) => r.supplier?.name || r.supplierName || '—' },
          { key: 'createdAt',    header: 'Date',     sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleDateString() },
          { key: 'status',       header: 'Status',   render: (r) => (
            <div>
              <Badge status={r.status} />
              {expanded === r.id && (
                <div className="flex items-center gap-2 mt-3">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i <= statusStep(r.status) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                      }`}>{i + 1}</div>
                      <span className={`text-xs ${i <= statusStep(r.status) ? 'text-ink-800 font-medium' : 'text-slate-400'}`}>{s}</span>
                      {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )},
          { key: 'totalAmount',  header: 'Total',    sortable: true, render: (r) => r.totalAmount != null ? Number(r.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—' },
        ]}
        actions={(r) => (
          String(r.status).toLowerCase() !== 'received'
            ? <IconButton icon="📥" title="Mark Received" color="success" onClick={() => receive(r.id)} />
            : <IconButton icon="✓" title="Received" color="success" />
        )}
        empty={{ icon: '📦', title: 'No orders', message: 'Generate your first purchase order.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Generate Order</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title="Generate Purchase Order" onSubmit={submit} loading={saving} submitLabel="Generate" size="lg">
        <SelectField label="Supplier" name="supplier" required value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          options={(suppliers || []).map((s) => ({ value: s.id, label: `${s.name}${s.rating ? ` ★ ${s.rating}/5` : ''}` }))}
          error={errors.supplier}
        />

        <label className="block text-sm font-medium text-ink-800 mb-2">Products <span className="text-danger">*</span></label>
        <div className="space-y-2 mb-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <select className="input"
                  value={line.productId}
                  onChange={(e) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, productId: e.target.value } : l))}
                >
                  <option value="" disabled>Select product…</option>
                  {(products || []).map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                </select>
              </div>
              <input type="number" min="0" placeholder="Qty" className="input col-span-2"
                value={line.quantity}
                onChange={(e) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, quantity: e.target.value } : l))}
              />
              <input type="number" min="0" step="0.01" placeholder="Unit price" className="input col-span-3"
                value={line.unitPrice}
                onChange={(e) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, unitPrice: e.target.value } : l))}
              />
              <button type="button" className="col-span-1 text-danger hover:bg-danger-50 rounded-lg cursor-pointer"
                onClick={() => removeLine(i)}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-outline mb-3" onClick={addLine}>➕ Add line</button>
        {errors.lines && <p className="text-xs text-danger">{errors.lines.message}</p>}

        <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
          <span className="text-slate-500">Total</span>
          <span className="font-semibold text-ink-800">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </FormModal>
    </div>
  );
}
