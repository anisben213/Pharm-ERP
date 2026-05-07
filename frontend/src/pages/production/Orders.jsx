import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Lock, AlertTriangle } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal, { ConfirmModal } from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { manufacturingOrderService, productService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function ProductionOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [closing, setClosing] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setOrders(await manufacturingOrderService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const close = async () => {
    setClosing(true);
    try {
      await manufacturingOrderService.close(closingId);
      toast.success('Order closed and sent to Quality Control');
      setClosingId(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setClosing(false); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'orderNumber', header: 'Order', sortable: true },
          { key: 'product', header: 'Product', accessor: (o) => o.batch?.product?.name || o.product?.name },
          {
            key: 'batchNumber',
            header: 'Batch',
            render: (o) => o.batch?.batchNumber ? (
              <Link to={`/stock_manager/batch-tracking/${encodeURIComponent(o.batch.batchNumber)}`}
                className="text-primary hover:underline">{o.batch.batchNumber}</Link>
            ) : '—',
          },
          {
            key: 'plannedDate', header: 'Planned', sortable: true,
            accessor: (o) => o.plannedDate,
            render: (o) => o.plannedDate ? new Date(o.plannedDate).toLocaleDateString() : '—',
          },
          { key: 'quantity', header: 'Quantity', render: (o) => o.batch?.quantity ?? '—' },
          { key: 'status', header: 'Status', render: (o) => (
            <div className="flex items-center gap-2">
              <StatusBadge status={o.status} />
              {o.batch?.qualityControls?.some((q) => q.result === 'REJECTED') && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger-600 bg-danger-50 border border-danger-200 rounded px-1.5 py-0.5">
                  <AlertTriangle size={11} /> Rework
                </span>
              )}
            </div>
          ) },
        ]}
        data={orders}
        loading={loading}
        searchKeys={['orderNumber']}
        filters={[{
          key: 'status',
          label: 'All statuses',
          options: [
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'PENDING_QC', label: 'Pending QC' },
            { value: 'CLOSED', label: 'Closed' },
          ],
        }]}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New Order
          </ActionButton>
        )}
        actions={(o) => o.status === 'IN_PROGRESS' ? (
          <ActionButton variant="close" size="sm" icon={<Lock size={14} />} onClick={() => setClosingId(o.id)}>
            Close Order
          </ActionButton>
        ) : null}
        empty={{ icon: '🏭', title: 'No manufacturing orders', message: 'Create one to start production.' }}
      />

      {createOpen && <CreateOrderModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}

      <ConfirmModal
        open={!!closingId}
        onClose={() => setClosingId(null)}
        onConfirm={close}
        title="Send to Quality Control?"
        message="The batch will be marked Pending QC. Quality team will be notified."
        confirmLabel="Close & Send"
        loading={closing}
      />
    </div>
  );
}

function CreateOrderModal({ onClose, onSaved }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', quantity: '', plannedDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    productService.list({ category: 'FINISHED_PRODUCT' }).then(setProducts).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await manufacturingOrderService.create({
        productId: form.productId,
        quantity: Number(form.quantity),
        plannedDate: form.plannedDate || null,
      });
      setCreated(order);
      toast.success(`Order ${order.orderNumber} created`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={created ? onSaved : onClose}
      title={created ? 'Order Created' : 'New Manufacturing Order'}
      footer={created ? (
        <button className="btn-primary" onClick={onSaved}>Done</button>
      ) : (
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="mo-form" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Order'}
          </button>
        </>
      )}
    >
      {created ? (
        <div className="space-y-2 text-sm">
          <div><span className="text-slate-500">Order:</span> <span className="font-medium">{created.orderNumber}</span></div>
          <div><span className="text-slate-500">Lot Number:</span> <span className="font-medium text-primary">{created.batch?.batchNumber}</span></div>
        </div>
      ) : (
        <form id="mo-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label-xs block mb-1.5">Finished Product</label>
            <select className="input" required value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs block mb-1.5">Quantity</label>
              <input type="number" min="1" step="0.01" required className="input" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="label-xs block mb-1.5">Planned Date</label>
              <input type="date" className="input" value={form.plannedDate}
                onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} />
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
