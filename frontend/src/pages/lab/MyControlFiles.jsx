import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function MyControlFiles() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const pending = (data || []).filter((b) => String(b.status).toLowerCase() === 'pending');
  return (
    <div>
      <PageHeader title="My Control Files" subtitle="Batches awaiting your analysis." />
      <Table
        loading={loading}
        data={pending}
        searchKeys={['batchNumber', 'productName']}
        columns={[
          { key: 'batchNumber',    header: 'Batch #',  render: (r) => <span className="font-mono text-primary">{r.batchNumber}</span> },
          { key: 'productName',    header: 'Product',  render: (r) => r.productName || r.product?.name },
          { key: 'manufacturedAt', header: 'Manufactured', render: (r) => r.manufacturedAt ? new Date(r.manufacturedAt).toLocaleDateString() : '—' },
          { key: 'status',         header: 'Status',   render: (r) => <Badge status={r.status} /> },
        ]}
        empty={{ icon: '✅', title: 'No pending files', message: 'No batches are awaiting your analysis.' }}
      />
    </div>
  );
}
