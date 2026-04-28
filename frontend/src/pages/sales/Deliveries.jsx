import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { salesService } from '../../services/index.js';

export default function Deliveries() {
  const { data, loading } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const items = (data || []).filter((o) => ['pending', 'in_progress', 'delivered'].includes(String(o.status).toLowerCase()));
  return (
    <div>
      <PageHeader title="Delivery Notes" subtitle="Track shipments out to clients." />
      <Table
        loading={loading} data={items}
        searchKeys={['orderNumber', 'customerName']}
        columns={[
          { key: 'orderNumber',  header: 'Order #',  render: (r) => <span className="font-mono">{r.orderNumber || r.id}</span> },
          { key: 'customerName', header: 'Client',   render: (r) => r.customer?.name || r.customerName },
          { key: 'createdAt',    header: 'Date',     sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleDateString() },
          { key: 'status',       header: 'Status',   render: (r) => <Badge status={r.status} /> },
        ]}
        empty={{ icon: '🚚', title: 'No deliveries', message: 'No deliveries to display.' }}
      />
    </div>
  );
}
