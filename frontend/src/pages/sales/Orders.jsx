import { useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal, { ConfirmModal } from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { salesOrderService, clientService, productService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

function totalOf(o) {
  return Number(o.totalAmount || 0);
}

export default function SalesOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setOrders(await salesOrderService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const confirm = async () => {
    setWorking(true);
    try {
      await salesOrderService.confirm(confirming.id);
      toast.success(`Order ${confirming.orderNumber} confirmed — Stock notified`);
      setConfirming(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Confirmation failed'); }
    finally { setWorking(false); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'orderNumber', header: 'Order', sortable: true },
          { key: 'client', header: 'Client', accessor: (o) => o.client?.name },
          {
            key: 'createdAt', header: 'Date', sortable: true,
            accessor: (o) => o.createdAt,
            render: (o) => new Date(o.createdAt).toLocaleDateString(),
          },
          { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
          { key: 'total', header: 'Total', render: (o) => `${totalOf(o).toLocaleString()} DZD` },
        ]}
        data={orders}
        loading={loading}
        searchKeys={['orderNumber']}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New Sales Order
          </ActionButton>
        )}
        actions={(o) => o.status === 'PENDING' ? (
          <ActionButton variant="confirm" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => setConfirming(o)}>
            Confirm Order
          </ActionButton>
        ) : null}
        empty={{ icon: '🛍️', title: 'No sales orders', message: 'Create your first order.' }}
      />

      {createOpen && <CreateSalesOrderModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}

      <ConfirmModal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={confirm}
        title="Confirm sales order?"
        message={confirming
          ? `Stock will be allocated for ${confirming.client?.name} and Stock Manager will be notified to prepare delivery.`
          : ''}
        confirmLabel="Confirm Order"
        loading={working}
      />
    </div>
  );
}

function CreateSalesOrderModal({ onClose, onSaved }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState([]); // [{productId, quantity, unitPrice}]
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    Promise.all([clientService.list(), productService.catalog()])
      .then(([c, cat]) => { setClients(c); setCatalog(cat); });
  }, []);

  const productById = useMemo(() => Object.fromEntries(catalog.map((p) => [p.id, p])), [catalog]);

  const addProduct = () => {
    const p = catalog[0];
    setItems([...items, { productId: p?.id || '', quantity: 1 }]);
  };
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, patch) => setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const total = items.reduce((s, it) => {
    const p = productById[it.productId];
    return s + Number(p?.unitPrice || 0) * Number(it.quantity || 0);
  }, 0);

  const canNext1 = !!clientId;
  const canNext2 = items.length > 0 && items.every((it) => it.productId && Number(it.quantity) > 0
    && Number(it.quantity) <= (productById[it.productId]?.availableQuantity || 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      const order = await salesOrderService.create({
        clientId,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
        })),
      });
      setCreated(order);
      toast.success(`Order ${order.orderNumber} created`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={created ? onSaved : onClose}
      title={created ? 'Order Created' : `New Sales Order — Step ${step} of 3`}
      footer={created ? (
        <button className="btn-primary" onClick={onSaved}>Done</button>
      ) : (
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          {step > 1 && <button className="btn-outline" onClick={() => setStep(step - 1)} disabled={submitting}>Back</button>}
          {step < 3 && (
            <button className="btn-primary"
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              onClick={() => setStep(step + 1)}>Next</button>
          )}
          {step === 3 && (
            <button className="btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          )}
        </>
      )}
    >
      {created ? (
        <div className="space-y-2 text-sm">
          <div><span className="text-slate-500">Order:</span> <span className="font-medium">{created.orderNumber}</span></div>
          <div><span className="text-slate-500">Status:</span> <StatusBadge status={created.status} /></div>
          <p className="text-slate-500 mt-3">Confirm the order from the list to allocate stock.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary' : 'bg-slate-200'}`} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <label className="label-xs block mb-1.5">Select Client</label>
              <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Choose client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="label-xs">Order Items</div>
                <button onClick={addProduct} type="button"
                  className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                  <Plus size={14} /> Add product
                </button>
              </div>
              {items.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg">
                  No items yet. Click "Add product" to start.
                </div>
              )}
              {items.map((it, idx) => {
                const p = productById[it.productId];
                const stock = p?.availableQuantity || 0;
                const overStock = Number(it.quantity) > stock;
                const lineTotal = Number(p?.unitPrice || 0) * Number(it.quantity || 0);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end border border-slate-200 rounded-lg p-3">
                    <div className="col-span-5">
                      <label className="label-xs block mb-1">Product</label>
                      <select className="input" value={it.productId}
                        onChange={(e) => updateItem(idx, { productId: e.target.value })}>
                        {catalog.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.availableQuantity} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="label-xs block mb-1">Quantity</label>
                      <input type="number" min="1" step="0.01"
                        className={`input ${overStock ? 'input-error' : ''}`}
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })} />
                      {p && <div className="text-[10px] text-slate-500 mt-0.5">Stock: {stock} {p.unit}</div>}
                    </div>
                    <div className="col-span-3">
                      <label className="label-xs block mb-1">Unit Price</label>
                      <div className="input bg-slate-50 text-slate-700 cursor-not-allowed">
                        {Number(p?.unitPrice || 0).toLocaleString()} DZD
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Subtotal: {lineTotal.toLocaleString()} DZD</div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeItem(idx)}
                        className="p-2 text-danger hover:bg-danger-50 rounded-lg cursor-pointer transition-all duration-200">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="label-xs mb-1">Client</div>
                <div className="font-medium text-ink-800">
                  {clients.find((c) => c.id === clientId)?.name}
                </div>
              </div>
              <div>
                <div className="label-xs mb-2">Items</div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const p = productById[it.productId];
                    const lineTotal = Number(p?.unitPrice || 0) * Number(it.quantity || 0);
                    return (
                      <div key={idx} className="px-3 py-2 flex justify-between text-sm">
                        <div>
                          <div className="font-medium text-ink-800">{p?.name}</div>
                          <div className="text-xs text-slate-500">
                            {it.quantity} {p?.unit} × {Number(p?.unitPrice || 0).toLocaleString()} DZD
                          </div>
                        </div>
                        <div className="font-medium text-ink-800">
                          {lineTotal.toLocaleString()} DZD
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                <span className="text-slate-500">Total</span>
                <span className="text-xl font-semibold text-ink-800">{total.toLocaleString()} DZD</span>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
