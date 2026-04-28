import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { purchaseService } from '../../services/index.js';

export default function OrderTracking() {
  const { data, loading } = useFetch(() => purchaseService.list().then((r) => r.orders), []);
  return (
    <div>
      <PageHeader title="Order Tracking" subtitle="Monitor delivery progress for active POs." />
      <Table
        loading={loading}
        data={(data || []).filter((o) => String(o.status).toLowerCase() !== 'received')}
        searchKeys={['orderNumber', 'supplierName']}
        columns={[
          { key: 'orderNumber',  header: 'Order #',  render: (r) => <span className="font-mono">{r.orderNumber || r.id}</span> },
          { key: 'supplierName', header: 'Supplier', render: (r) => r.supplier?.name || r.supplierName },
          { key: 'createdAt',    header: 'Sent',     sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleDateString() },
          { key: 'expectedAt',   header: 'Expected', render: (r) => r.expectedAt ? new Date(r.expectedAt).toLocaleDateString() : '—' },
          { key: 'status',       header: 'Status',   render: (r) => <Badge status={r.status} /> },
        ]}
        empty={{ icon: '🚚', title: 'No tracking', message: 'No active deliveries to track.' }}
      />
    </div>
  );
}
