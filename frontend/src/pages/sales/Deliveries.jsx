import { useState } from 'react';
import { Truck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { salesService } from '../../services/index.js';

export default function Deliveries() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const [delivering, setDelivering] = useState(null);
  const [acting, setActing] = useState(false);

  const pending   = (data || []).filter((o) => o.status === 'CONFIRMED');
  const delivered = (data || []).filter((o) => o.status === 'DELIVERED');

  const doDeliver = async () => {
    setActing(true);
    try {
      await salesService.deliver(delivering.id);
      toast.success(`Order ${delivering.reference} delivered`);
      setDelivering(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to deliver');
    } finally { setActing(false); }
  };

  const columns = [
    { key: 'reference', header: 'Order #', render: (r) => <span className="font-mono">{r.reference || r.id}</span> },
    { key: 'customer',  header: 'Client',  render: (r) => r.customer?.name || '—' },
    { key: 'lines',     header: 'Batches', render: (r) => (r.lines || []).map((l) => l.batch?.batchNumber).filter(Boolean).join(', ') || `${(r.lines || []).length} item(s)` },
    { key: 'createdAt', header: 'Date',    sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'status',    header: 'Status',  render: (r) => <Badge status={r.status} label={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Notes" subtitle="Dispatch confirmed orders and track delivery by batch number." />

      <div className="card">
        <h3 className="font-semibold mb-3 text-warning-600">Awaiting Dispatch ({pending.length})</h3>
        <Table
          loading={loading} data={pending}
          searchKeys={['reference']}
          columns={columns}
          actions={(r) => (
            <IconButton icon={<Truck size={15} />} title="Mark as Delivered" color="success" onClick={() => setDelivering(r)} />
          )}
          empty={{ icon: '🚚', title: 'No pending deliveries', message: 'All confirmed orders have been dispatched.' }}
        />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3 text-success-600">Delivered ({delivered.length})</h3>
        <Table
          loading={loading} data={delivered}
          searchKeys={['reference']}
          columns={columns}
          empty={{ icon: '✓', title: 'No delivered orders', message: 'Delivered orders will appear here.' }}
        />
      </div>

      <ConfirmModal
        open={!!delivering}
        onClose={() => setDelivering(null)}
        title="Confirm Dispatch"
        message={`Mark order ${delivering?.reference} as DELIVERED? Linked batch numbers: ${(delivering?.lines || []).map((l) => l.batch?.batchNumber).filter(Boolean).join(', ') || '—'}`}
        confirmLabel="Deliver"
        loading={acting}
        onConfirm={doDeliver}
      />
    </div>
  );
}

