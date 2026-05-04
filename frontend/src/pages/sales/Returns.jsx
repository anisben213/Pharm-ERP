import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { salesService } from '../../services/index.js';

export default function Returns() {
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const returns = (data || []).filter((o) => String(o.status).toLowerCase() === 'returned');
  return (
    <div>
      <PageHeader title="Returns" subtitle="Customer returns and post-sale adjustments." />
      {returns.length === 0 && !loading
        ? <div className="card"><EmptyState icon="↩️" title="No returns" message="No returned orders this period." /></div>
        : (
          <Table
            loading={loading} data={returns}
            searchKeys={['reference']}
            columns={[
              { key: 'reference',    header: 'Order #',  render: (r) => <span className="font-mono">{r.reference || r.id}</span> },
              { key: 'customer',     header: 'Client',   render: (r) => r.customer?.name || '—' },
              { key: 'returnReason', header: 'Reason',   render: (r) => r.returnReason || '—' },
              { key: 'updatedAt',    header: 'Returned', sortable: true, render: (r) => new Date(r.updatedAt || r.createdAt).toLocaleDateString() },
              { key: 'status',       header: 'Status',   render: (r) => <Badge status={r.status} label={r.status} /> },
            ]}
            actions={(r) => (
              <div className="flex gap-1 justify-center">
                <IconButton icon={<Eye size={15} />} title="View order" color="primary" onClick={() => navigate(`/sales_manager/orders/${r.id}`)} />
              </div>
            )}
            empty={{ icon: '↩️', title: 'No returns', message: 'No returned orders.' }}
          />
        )}
    </div>
  );
}
