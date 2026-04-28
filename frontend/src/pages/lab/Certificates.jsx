import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function LabCertificates() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const validated = (data || []).filter((b) => String(b.status).toLowerCase() === 'validated');
  return (
    <div>
      <PageHeader title="My Certificates" subtitle="Certificates generated from your analyses." />
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
        empty={{ icon: '📄', title: 'No certificates yet', message: 'Submit results to generate certificates.' }}
      />
    </div>
  );
}
