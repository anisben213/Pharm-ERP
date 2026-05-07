import { useEffect, useState } from 'react';
import { Plus, PackageCheck } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal, { ConfirmModal } from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { purchaseOrderService, productService, supplierService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function PurchaseOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [receiving, setReceiving] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setOrders(await purchaseOrderService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const receive = async () => {
    setWorking(true);
    try {
      const res = await purchaseOrderService.receive(receiving.id);
      toast.success(`Received — RM batch ${res.batch?.batchNumber} pending QC`);
      setReceiving(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'orderNumber', header: 'Order', sortable: true },
          { key: 'supplier', header: 'Supplier', accessor: (o) => o.supplier?.name },
          { key: 'product', header: 'Product', accessor: (o) => o.product?.name },
          { key: 'quantity', header: 'Quantity', render: (o) => `${o.quantity} ${o.product?.unit || ''}` },
          {
            key: 'orderDate', header: 'Date', sortable: true,
            accessor: (o) => o.orderDate || o.createdAt,
            render: (o) => new Date(o.orderDate || o.createdAt).toLocaleDateString(),
          },
          { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
        ]}
        data={orders}
        loading={loading}
        searchKeys={['orderNumber']}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New Purchase Order
          </ActionButton>
        )}
        actions={(o) => o.status !== 'RECEIVED' ? (
          <ActionButton variant="receive" size="sm" icon={<PackageCheck size={14} />} onClick={() => setReceiving(o)}>
            Confirm Reception
          </ActionButton>
        ) : null}
        empty={{ icon: '🛒', title: 'No purchase orders', message: 'Create one to procure raw materials.' }}
      />

      {createOpen && <CreateOrderModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}

      <ConfirmModal
        open={!!receiving}
        onClose={() => setReceiving(null)}
        onConfirm={receive}
        title="Confirm reception?"
        message={receiving ? `An RM batch will be created for ${receiving.product?.name} (${receiving.quantity} ${receiving.product?.unit || ''}) and sent to Quality Control.` : ''}
        confirmLabel="Confirm Reception"
        loading={working}
      />
    </div>
  );
}

function CreateOrderModal({ onClose, onSaved }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ supplierId: '', productId: '', quantity: '', orderDate: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      productService.list({ category: 'RAW_MATERIAL' }),
      supplierService.list(),
    ]).then(([p, s]) => { setProducts(p); setSuppliers(s); });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await purchaseOrderService.create({
        supplierId: form.supplierId,
        productId: form.productId,
        quantity: Number(form.quantity),
        orderDate: form.orderDate,
      });
      toast.success(`Order ${order.orderNumber} created`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={onClose} title="New Purchase Order"
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="po-form" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Order'}
          </button>
        </>
      )}>
      <form id="po-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label-xs block mb-1.5">Supplier</label>
          <select className="input" required value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">Select supplier…</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-xs block mb-1.5">Raw Material</label>
          <select className="input" required value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">Select material…</option>
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
            <label className="label-xs block mb-1.5">Order Date</label>
            <input type="date" className="input" value={form.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
