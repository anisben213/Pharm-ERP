import { useState } from 'react';
import { Truck, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { salesService } from '../../services/index.js';

export default function StockDeliveryNotes() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const [confirm, setConfirm] = useState(null);
  const [delivering, setDelivering] = useState(false);

  const pending   = (data || []).filter((o) => o.status === 'CONFIRMED');
  const delivered = (data || []).filter((o) => o.status === 'DELIVERED');

  const handleDeliver = async () => {
    setDelivering(true);
    try {
      await salesService.deliver(confirm.id);
      toast.success(`Delivery note generated — ${confirm.reference || confirm.id}`);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    } finally { setDelivering(false); setConfirm(null); }
  };

  const columns = [
    { key: 'reference', header: 'Order #',   render: (r) => <span className="font-mono text-xs">{r.reference || r.id}</span> },
    { key: 'customer',  header: 'Client',    render: (r) => r.customer?.name || '—' },
    { key: 'items',     header: 'Items',     render: (r) => (r.lines || []).length },
    { key: 'createdBy', header: 'Created by',render: (r) => r.createdBy?.fullName || '—' },
    { key: 'createdAt', header: 'Date',      sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'status',    header: 'Status',    render: (r) => <Badge status={r.status} label={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Notes"
        subtitle="Confirmed sales orders waiting for stock dispatch."
      />

      {/* Pending delivery */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Truck size={18} className="text-warning-500" />
          <h3 className="font-semibold">Awaiting Dispatch <span className="text-warning-500">({pending.length})</span></h3>
        </div>
        <Table
          loading={loading}
          data={pending}
          searchKeys={['reference']}
          columns={columns}
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              <IconButton
                icon={<Truck size={15} />}
                title="Generate Delivery Note"
                color="primary"
                onClick={() => setConfirm(r)}
              />
            </div>
          )}
          empty={{ icon: '🚚', title: 'No pending deliveries', message: 'All confirmed orders have been dispatched.' }}
        />
      </div>

      {/* Delivered */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={18} className="text-success-500" />
          <h3 className="font-semibold">Delivered <span className="text-success-500">({delivered.length})</span></h3>
        </div>
        <Table
          loading={loading}
          data={delivered}
          searchKeys={['reference']}
          columns={columns}
          empty={{ icon: '✓', title: 'No deliveries yet', message: 'Dispatched orders will appear here.' }}
        />
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDeliver}
        loading={delivering}
        title="Generate Delivery Note"
        confirmLabel="Confirm & Dispatch"
        message={`Mark order ${confirm?.reference || confirm?.id} (client: ${confirm?.customer?.name || '—'}) as dispatched? Stock movements will be finalized.`}
      />
    </div>
  );
}
