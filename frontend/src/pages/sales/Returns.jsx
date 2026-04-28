import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { salesService } from '../../services/index.js';

export default function Returns() {
  const { data, loading } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const returns = (data || []).filter((o) => String(o.status).toLowerCase() === 'returned');
  return (
    <div>
      <PageHeader title="Returns" subtitle="Customer returns & post-sale adjustments." />
      {returns.length === 0 && !loading
        ? <div className="card"><EmptyState icon="↩️" title="No returns" message="No returned orders this period." /></div>
        : (
          <Table
            loading={loading} data={returns}
            searchKeys={['orderNumber', 'customerName']}
            columns={[
              { key: 'orderNumber',  header: 'Order #',  render: (r) => <span className="font-mono">{r.orderNumber || r.id}</span> },
              { key: 'customerName', header: 'Client',   render: (r) => r.customer?.name || r.customerName },
              { key: 'returnReason', header: 'Reason',   render: (r) => r.returnReason || '—' },
              { key: 'updatedAt',    header: 'Returned', sortable: true, render: (r) => new Date(r.updatedAt || r.createdAt).toLocaleDateString() },
              { key: 'status',       header: 'Status',   render: (r) => <Badge status={r.status} /> },
            ]}
            empty={{ icon: '↩️', title: 'No returns', message: 'No returned orders.' }}
          />
        )}
    </div>
  );
}
