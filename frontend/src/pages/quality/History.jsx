import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function QualityHistory() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  return (
    <div>
      <PageHeader title="Quality History" subtitle="Audit trail of all QC decisions." />
      <Table
        loading={loading}
        data={data || []}
        searchKeys={['batchNumber', 'productName']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'IN_QUARANTINE', label: 'In Quarantine' },
          { value: 'APPROVED',     label: 'Approved' },
          { value: 'REJECTED',     label: 'Rejected' },
          { value: 'RECALLED',     label: 'Recalled' },
        ]}]}
        columns={[
          { key: 'batchNumber', header: 'Batch #', render: (r) => <span className="font-mono text-primary">{r.batchNumber}</span> },
          { key: 'productName', header: 'Product', render: (r) => r.product?.name || r.productName || '—' },
          { key: 'updatedAt',   header: 'Updated', sortable: true, render: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—' },
          { key: 'status',      header: 'Status',  render: (r) => <Badge status={r.status} /> },
        ]}
        empty={{ icon: '📜', title: 'No history', message: 'No quality decisions recorded yet.' }}
      />
    </div>
  );
}
