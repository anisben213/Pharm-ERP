import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function BatchNumbers() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);

  return (
    <div>
      <PageHeader title="Batch Numbers" subtitle="All batches generated from production orders." />
      <Table
        loading={loading}
        data={data || []}
        searchKeys={['batchNumber', 'productName']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'validated', label: 'Validated' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'recalled', label: 'Recalled' },
        ]}]}
        columns={[
          { key: 'batchNumber', header: 'Batch #', sortable: true,
            render: (r) => <Link to={`/stock_manager/batches/${r.batchNumber}`} className="font-mono text-primary hover:underline">{r.batchNumber}</Link> },
          { key: 'productName', header: 'Product', render: (r) => r.productName || r.product?.name || '—' },
          { key: 'manufacturedAt', header: 'Manufactured', sortable: true, render: (r) => r.manufacturedAt ? new Date(r.manufacturedAt).toLocaleDateString() : '—' },
          { key: 'expiresAt', header: 'Expires', sortable: true, render: (r) => r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—' },
          { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
        ]}
        empty={{ icon: '🏷️', title: 'No batches', message: 'Batches will appear here once production orders are created.' }}
      />
    </div>
  );
}
