import { useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function NonConformities() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const nc = useMemo(() => (data || []).filter((b) => String(b.status).toLowerCase() === 'rejected'), [data]);

  return (
    <div>
      <PageHeader title="Non-Conformities" subtitle="Rejected batches with corrective actions." />
      <Table
        loading={loading}
        data={nc}
        searchKeys={['batchNumber', 'productName', 'reason']}
        filters={[{ key: 'severity', label: 'All severities', options: [
          { value: 'critical', label: 'Critical' },
          { value: 'major',    label: 'Major' },
          { value: 'minor',    label: 'Minor' },
        ]}]}
        columns={[
          { key: 'batchNumber', header: 'Batch #',  render: (r) => <span className="font-mono text-primary">{r.batchNumber}</span> },
          { key: 'productName', header: 'Product',  render: (r) => r.productName || r.product?.name },
          { key: 'severity',    header: 'Severity', render: (r) => <Badge status={r.severity || 'major'} /> },
          { key: 'reason',      header: 'Reason' },
          { key: 'corrective',  header: 'Corrective Action', render: (r) => (
            <input
              defaultValue={r.correctiveAction || ''}
              placeholder="Add corrective action…"
              className="input text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          )},
        ]}
        empty={{ icon: '✅', title: 'No non-conformities', message: 'All batches are conforming. Keep it up!' }}
      />
    </div>
  );
}
