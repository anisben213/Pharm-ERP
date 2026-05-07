import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { deliveryNoteService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function StockDeliveries() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setNotes(await deliveryNoteService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const confirmDeliver = async () => {
    setWorking(true);
    try {
      await deliveryNoteService.setStatus(pending.id, 'DELIVERED');
      toast.success('Delivery marked as delivered — order status updated');
      setPending(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'noteNumber', header: 'Note', sortable: true },
          { key: 'order',  header: 'Sales Order', accessor: (n) => n.salesOrder?.orderNumber },
          { key: 'client', header: 'Client',       accessor: (n) => n.salesOrder?.client?.name },
          {
            key: 'deliveryDate', header: 'Date', sortable: true,
            accessor: (n) => n.deliveryDate,
            render: (n) => n.deliveryDate ? new Date(n.deliveryDate).toLocaleDateString() : '—',
          },
          { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
          {
            key: 'total', header: 'Total',
            render: (n) => n.salesOrder?.totalAmount != null
              ? `${Number(n.salesOrder.totalAmount).toLocaleString()} DZD`
              : '—',
          },
        ]}
        data={notes}
        loading={loading}
        searchKeys={['noteNumber']}
        filters={[{
          key: 'status',
          label: 'Filter by status',
          options: [
            { value: 'PREPARED',  label: 'Prepared'  },
            { value: 'SHIPPED',   label: 'Shipped'   },
            { value: 'DELIVERED', label: 'Delivered' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ],
        }]}
        actions={(n) => (
          <div className="flex items-center justify-center">
            {(n.status === 'PREPARED' || n.status === 'SHIPPED') ? (
              <ActionButton variant="success" size="sm" icon={<CheckCircle2 size={14} />}
                onClick={() => setPending(n)}>
                Mark Delivered
              </ActionButton>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </div>
        )}
        empty={{ icon: '🚚', title: 'No delivery notes', message: 'Delivery notes will appear here once sales orders are confirmed.' }}
      />

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDeliver}
        title="Confirm delivery?"
        message={`Mark delivery note ${pending?.noteNumber} as delivered? The sales order will be updated to Delivered.`}
        confirmLabel="Mark as Delivered"
        loading={working}
      />
    </div>
  );
}
