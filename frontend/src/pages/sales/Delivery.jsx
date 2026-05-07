import { useEffect, useState } from 'react';
import { Truck, XCircle } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { deliveryNoteService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function Delivery() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
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
      toast.success(pending.status === 'SHIPPED' ? 'Marked as shipped' : 'Delivery cancelled — stock restored');
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
            key: 'deliveryDate', header: 'Date', sortable: true,
            accessor: (n) => n.deliveryDate,
            render: (n) => new Date(n.deliveryDate).toLocaleDateString(),
          },
          { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
        ]}
        data={notes}
        loading={loading}
        searchKeys={['noteNumber']}
        actions={(n) => (
          <div className="flex items-center justify-center gap-2">
            {n.status === 'PREPARED' ? (
              <>
                <ActionButton variant="ship" size="sm" icon={<Truck size={14} />}
                  onClick={() => setPending({ note: n, status: 'SHIPPED' })}>
                  Mark Shipped
                </ActionButton>
                <ActionButton variant="danger" size="sm" icon={<XCircle size={14} />}
                  onClick={() => setPending({ note: n, status: 'CANCELLED' })}>
                  Cancel
                </ActionButton>
              </>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </div>
        )}
        empty={{ icon: '🚚', title: 'No delivery notes', message: 'Notes are auto-created when a sales order is confirmed.' }}
      />

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={advance}
        title={pending?.status === 'SHIPPED' ? 'Mark as shipped?' : 'Cancel delivery?'}
        message={pending?.status === 'SHIPPED'
          ? `Delivery note ${pending?.note?.noteNumber} will be marked as shipped.`
          : `Delivery note ${pending?.note?.noteNumber} will be cancelled and the allocated stock restored.`}
        confirmLabel={pending?.status === 'SHIPPED' ? 'Mark Shipped' : 'Cancel Delivery'}
        loading={working}
      />
    </div>
  );
}
