import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    batchService.list().then((d) => setBatches(d.batches || [])).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'batchNumber', label: 'Batch #' },
    { key: 'product', label: 'Product', render: (r) => r.product?.name || '—' },
    { key: 'type', label: 'Type', render: (r) => r.product?.type || '—' },
    { key: 'remainingQty', label: 'Qty' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'expiryDate', label: 'Expiry', render: (r) => r.expiryDate?.slice(0, 10) || '—' },
  ];

  return (
    <div>
      <PageHeader title="Batches" subtitle="End-to-end traceability" />
      {loading ? <div>Loading…</div> : (
        <Table columns={columns} rows={batches} onRowClick={(r) => nav(`/batches/${r.id}`)} />
      )}
    </div>
  );
}
