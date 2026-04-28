import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import { IconButton } from '../../components/common/Table.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function Certificates() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const validated = (data || []).filter((b) => String(b.status).toLowerCase() === 'validated');
  return (
    <div>
      <PageHeader title="Certificates of Analysis" subtitle="Download CoA for validated batches." />
      <Table
        loading={loading}
        data={validated}
        searchKeys={['batchNumber', 'productName']}
        columns={[
          { key: 'batchNumber', header: 'Batch #',     render: (r) => <span className="font-mono text-primary">{r.batchNumber}</span> },
          { key: 'productName', header: 'Product',     render: (r) => r.productName || r.product?.name },
          { key: 'validatedAt', header: 'Issued',      render: (r) => r.validatedAt ? new Date(r.validatedAt).toLocaleDateString() : '—' },
        ]}
        actions={(r) => <IconButton icon="📥" title="Download" color="primary" onClick={() => alert(`Download CoA for ${r.batchNumber}`)} />}
        empty={{ icon: '📄', title: 'No certificates', message: 'Certificates appear after batches are validated.' }}
      />
    </div>
  );
}
