import { useEffect, useState } from 'react';
import { Plus, Truck, PackageCheck } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal, { ConfirmModal } from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { deliveryNoteService, salesOrderService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function Delivery() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState(null); // { note, status }
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setNotes(await deliveryNoteService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const advance = async () => {
    setWorking(true);
    try {
      await deliveryNoteService.setStatus(pending.note.id, pending.status);
      toast.success(`Marked ${pending.status.toLowerCase()}`);
      setPending(null); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'noteNumber', header: 'Note', sortable: true },
          { key: 'order', header: 'Sales Order', accessor: (n) => n.salesOrder?.orderNumber },
          { key: 'client', header: 'Client', accessor: (n) => n.salesOrder?.client?.name },
          {
            key: 'createdAt', header: 'Date', sortable: true,
            accessor: (n) => n.createdAt,
            render: (n) => new Date(n.createdAt).toLocaleDateString(),
          },
          { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
        ]}
        data={notes}
        loading={loading}
        searchKeys={['noteNumber']}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New Delivery Note
          </ActionButton>
        )}
        actions={(n) => (
          <div className="flex items-center gap-2">
            {n.status === 'PREPARED' && (
              <ActionButton variant="ship" size="sm" icon={<Truck size={14} />}
                onClick={() => setPending({ note: n, status: 'SHIPPED' })}>
                Mark Shipped
              </ActionButton>
            )}
            {n.status === 'SHIPPED' && (
              <ActionButton variant="deliver" size="sm" icon={<PackageCheck size={14} />}
                onClick={() => setPending({ note: n, status: 'DELIVERED' })}>
                Mark Delivered
              </ActionButton>
            )}
          </div>
        )}
        empty={{ icon: '🚚', title: 'No delivery notes', message: 'Notes appear after a sales order is confirmed.' }}
      />

      {createOpen && <CreateNoteModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={advance}
        title={pending?.status === 'SHIPPED' ? 'Mark as shipped?' : 'Mark as delivered?'}
        message={pending?.status === 'DELIVERED'
          ? 'The sales order will also be marked as Delivered.'
          : 'Update delivery status.'}
        confirmLabel={pending?.status === 'SHIPPED' ? 'Mark Shipped' : 'Mark Delivered'}
        loading={working}
      />
    </div>
  );
}

function CreateNoteModal({ onClose, onSaved }) {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    salesOrderService.list().then((all) => {
      setOrders(all.filter((o) => o.status === 'CONFIRMED' && !o.deliveryNote));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const note = await deliveryNoteService.create({ salesOrderId: orderId });
      toast.success(`Delivery note ${note.noteNumber} created`);
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={onClose} title="New Delivery Note"
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="dn-form" type="submit" className="btn-primary" disabled={submitting || !orderId}>
            {submitting ? 'Creating…' : 'Create Note'}
          </button>
        </>
      )}>
      <form id="dn-form" onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-500">Select a confirmed sales order without an existing delivery note.</p>
        <select className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
          <option value="">Choose order…</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNumber} — {o.client?.name}
            </option>
          ))}
        </select>
        {orders.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-3">
            No confirmed orders awaiting a delivery note.
          </div>
        )}
      </form>
    </Modal>
  );
}
