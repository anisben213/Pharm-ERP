import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { qualityControlService } from '../../services/index.js';

export default function QualityHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);

  useEffect(() => {
    (async () => {
      try { setHistory(await qualityControlService.history()); }
      finally { setLoading(false); }
    })();
  }, []);

  const view = async (qc) => {
    try {
      const data = await qualityControlService.certificate(qc.id);
      setCert(data);
    } catch { setCert({ ...qc, _basic: true }); }
  };

  return (
    <>
      <Table
        columns={[
          {
            key: 'batchNumber', header: 'Batch', sortable: true,
            accessor: (h) => h.batch?.batchNumber,
            render: (h) => h.batch?.batchNumber ? (
              <Link to={`/stock_manager/batch-tracking/${encodeURIComponent(h.batch.batchNumber)}`}
                className="text-primary hover:underline">{h.batch.batchNumber}</Link>
            ) : '—',
          },
          { key: 'product', header: 'Product', accessor: (h) => h.batch?.product?.name },
          {
            key: 'createdAt', header: 'Date', sortable: true,
            accessor: (h) => h.createdAt,
            render: (h) => new Date(h.createdAt).toLocaleString(),
          },
          { key: 'result', header: 'Result', render: (h) => <StatusBadge status={h.result} /> },
          { key: 'origin', header: 'Origin', render: (h) => <StatusBadge status={h.origin} /> },
          {
            key: 'notes', header: 'Notes',
            render: (h) => (
              <span className="text-sm text-slate-600 truncate max-w-[260px] inline-block align-middle">
                {h.notes || '—'}
              </span>
            ),
          },
        ]}
        data={history}
        loading={loading}
        searchKeys={['notes']}
        filters={[{
          key: 'result',
          label: 'All results',
          options: [
            { value: 'VALIDATED', label: 'Validated' },
            { value: 'REJECTED', label: 'Rejected' },
          ],
        }]}
        actions={(h) => h.result === 'VALIDATED' ? (
          <ActionButton variant="view" size="sm" icon={<FileText size={14} />} onClick={() => view(h)}>
            Certificate
          </ActionButton>
        ) : null}
        empty={{ icon: '📚', title: 'No history', message: 'Validated and rejected controls will appear here.' }}
      />

      {cert && (
        <Modal open onClose={() => setCert(null)} title="Quality Certificate"
          footer={<button className="btn-primary" onClick={() => setCert(null)}>Close</button>}>
          <div className="space-y-3 text-sm">
            <Row label="Batch Number" value={cert.batch?.batchNumber} />
            <Row label="Product" value={cert.batch?.product?.name} />
            <Row label="Result" value={<StatusBadge status={cert.result} />} />
            <Row label="Origin" value={cert.origin} />
            <Row label="Date" value={new Date(cert.createdAt).toLocaleString()} />
            <Row label="Inspector" value={cert.user?.fullName || cert.user?.username || '—'} />
            <div>
              <div className="label-xs mb-1">Notes</div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 whitespace-pre-wrap">
                {cert.notes || '—'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ink-800 text-right">{value || '—'}</span>
    </div>
  );
}
