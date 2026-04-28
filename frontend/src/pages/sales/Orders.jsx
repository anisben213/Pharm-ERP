import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { salesService, customerService, productService, stockService } from '../../services/index.js';

export default function SalesOrders() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const { data: customers } = useFetch(() => customerService.list().then((r) => r.customers).catch(() => []), []);
  const { data: products } = useFetch(() => productService.list().then((r) => r.products).catch(() => []), []);
  const { data: summary } = useFetch(() => stockService.summary().then((r) => r.summary).catch(() => []), []);
  const stockOf = (id) => Number((summary || []).find((s) => (s.productId || s.id) === id)?.quantity ?? 0);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);

  const reset = () => { setStep(1); setCustomerId(''); setLines([]); };
  const close = () => { setOpen(false); reset(); };

  const insufficient = useMemo(() => lines.filter((l) => l.productId && Number(l.quantity || 0) > stockOf(l.productId)), [lines, summary]);

  const submit = async () => {
    if (!customerId) { toast.warning('Select a client'); return; }
    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) { toast.warning('Add at least one product'); return; }
    if (insufficient.length > 0) { toast.error('Insufficient stock for some products'); return; }
    setSaving(true);
    try {
      await salesService.create({ customerId, lines: validLines });
      toast.success('Sales order created');
      close();
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create order');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>➕ Create Order</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['orderNumber', 'customerName']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'returned', label: 'Returned' },
        ]}]}
        onRowClick={(r) => navigate(`/sales_manager/orders/${r.id}`)}
        columns={[
          { key: 'orderNumber',  header: 'Order #', render: (r) => <span className="font-mono">{r.orderNumber || r.id}</span> },
          { key: 'customerName', header: 'Client',  render: (r) => r.customer?.name || r.customerName || '—' },
          { key: 'createdAt',    header: 'Date',    sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleDateString() },
          { key: 'status',       header: 'Status',  render: (r) => <Badge status={r.status} /> },
          { key: 'totalAmount',  header: 'Total',   sortable: true, render: (r) => Number(r.totalAmount ?? r.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
        ]}
        actions={(r) => <IconButton icon="👁" title="View" color="primary" onClick={() => navigate(`/sales_manager/orders/${r.id}`)} />}
        empty={{ icon: '🛒', title: 'No sales orders yet', message: 'Create your first sales order.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Create Order</button> }}
      />

      <Modal
        open={open} onClose={close}
        title={`Create Sales Order — Step ${step} of 3`}
        size="lg"
        footer={(
          <>
            <button className="btn-ghost" onClick={close} disabled={saving}>Cancel</button>
            {step > 1 && <button className="btn-outline" onClick={() => setStep(step - 1)} disabled={saving}>← Back</button>}
            {step < 3 && (
              <button
                className="btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !customerId) || (step === 2 && lines.length === 0)}
              >Next →</button>
            )}
            {step === 3 && (
              <button className="btn-primary" onClick={submit} disabled={saving || insufficient.length > 0}>
                {saving ? 'Creating…' : '✓ Confirm Order'}
              </button>
            )}
          </>
        )}
      >
        {step === 1 && (
          <SelectField label="Client" required value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={(customers || []).map((c) => ({ value: c.id, label: c.name }))}
          />
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              {lines.map((l, i) => {
                const stock = stockOf(l.productId);
                const insuf = l.productId && Number(l.quantity || 0) > stock;
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-7">
                      <select className="input"
                        value={l.productId}
                        onChange={(e) => setLines((ls) => ls.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x))}
                      >
                        <option value="" disabled>Select product…</option>
                        {(products || []).filter((p) => p.type === 'FINISHED_PRODUCT').map((p) => (
                          <option key={p.id} value={p.id}>{p.name} — stock: {stockOf(p.id)}</option>
                        ))}
                      </select>
                      {insuf && <p className="text-xs text-danger mt-1">Insufficient stock (only {stock} available)</p>}
                    </div>
                    <input type="number" min="1" placeholder="Qty" className={`input col-span-3 ${insuf ? 'input-error' : ''}`}
                      value={l.quantity}
                      onChange={(e) => setLines((ls) => ls.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))}
                    />
                    <button type="button" className="col-span-2 text-danger hover:bg-danger-50 rounded-lg cursor-pointer"
                      onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>Remove</button>
                  </div>
                );
              })}
            </div>
            <button type="button" className="btn-outline mt-3" onClick={() => setLines((ls) => [...ls, { productId: '', quantity: '' }])}>➕ Add product</button>
          </>
        )}

        {step === 3 && (
          <div>
            <h4 className="font-semibold mb-2">Review</h4>
            <p className="text-sm text-slate-600 mb-3">Client: <span className="font-medium text-ink-800">{(customers || []).find((c) => c.id === customerId)?.name || '—'}</span></p>
            <ul className="text-sm divide-y divide-slate-100 mb-3">
              {lines.map((l, i) => {
                const p = (products || []).find((x) => x.id === l.productId);
                const stock = stockOf(l.productId);
                const insuf = Number(l.quantity || 0) > stock;
                return (
                  <li key={i} className="py-2 flex justify-between">
                    <span>{p?.name || '—'} × {l.quantity}</span>
                    {insuf
                      ? <span className="text-danger text-xs">⚠ Insufficient stock</span>
                      : <span className="text-success-600 text-xs">✓ In stock</span>}
                  </li>
                );
              })}
            </ul>
            {insufficient.length > 0 && <p className="text-sm text-danger">Resolve stock issues before confirming.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
