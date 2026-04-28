import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { stockService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MyMovements() {
  const { user } = useAuth();
  const { data, loading } = useFetch(() => stockService.movements().then((r) => r.movements), []);
  const mine = (data || []).filter((m) => (m.user?.id || m.userId) === user?.id);

  return (
    <div>
      <PageHeader title="My Movements" subtitle="History of movements you have recorded." />
      <Table
        loading={loading}
        data={mine}
        searchKeys={['batchNumber', 'productName', 'reason']}
        columns={[
          { key: 'createdAt',   header: 'Date',    sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleString() },
          { key: 'productName', header: 'Product', render: (r) => r.productName || r.product?.name || '—' },
          { key: 'batchNumber', header: 'Batch #', render: (r) => r.batchNumber ? <span className="font-mono text-primary">{r.batchNumber}</span> : '—' },
          { key: 'type',        header: 'Type',    render: (r) => <Badge status={r.type === 'IN' ? 'active' : 'pending'} label={r.type === 'IN' ? 'Entry' : 'Exit'} /> },
          { key: 'quantity',    header: 'Qty' },
        ]}
        empty={{ icon: '📜', title: 'No history', message: 'You haven\'t recorded any movements yet.' }}
      />
    </div>
  );
}
