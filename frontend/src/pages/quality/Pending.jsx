import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { qualityControlService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

const TABS = [
  { key: 'RM', label: 'Raw Materials' },
  { key: 'LOT', label: 'Finished Products' },
];

export default function QualityPending() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('RM');
  const [action, setAction] = useState(null); // { mode: 'validate'|'reject', batch }
  const [working, setWorking] = useState(false);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try { setBatches(await qualityControlService.pending()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => batches.filter((b) => b.batchType === tab), [batches, tab]);

  const submit = async () => {
    if (action.mode === 'reject' && !notes.trim()) {
      toast.error('Rejection requires notes');
      return;
    }
    setWorking(true);
    try {
      if (action.mode === 'validate') {
        await qualityControlService.validate(action.batch.id, notes);
        toast.success(`Batch ${action.batch.batchNumber} validated and entered stock`);
      } else {
        await qualityControlService.reject(action.batch.id, notes);
        toast.success(`Batch ${action.batch.batchNumber} rejected`);
      }
      setAction(null); setNotes(''); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  const close = () => { setAction(null); setNotes(''); };

  const counts = useMemo(() => ({
    RM: batches.filter((b) => b.batchType === 'RM').length,
    LOT: batches.filter((b) => b.batchType === 'LOT').length,
  }), [batches]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-card p-1.5 flex gap-1 inline-flex w-auto self-start">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              tab === t.key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {t.label} <span className="opacity-70 ml-1">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      <Table
        columns={[
          {
            key: 'batchNumber', header: 'Batch', sortable: true,
            render: (b) => (
              <Link to={`/quality_manager/pending`}
                className="text-primary font-medium hover:underline cursor-default" onClick={(e) => e.preventDefault()}>
                {b.batchNumber}
              </Link>
            ),
          },
          { key: 'product', header: 'Product', accessor: (b) => b.product?.name },
          { key: 'origin', header: 'Origin', render: (b) => <StatusBadge status={b.origin} /> },
          {
            key: 'orderRef', header: 'Order',
            render: (b) => b.manufacturingOrder?.orderNumber || b.purchaseOrder?.orderNumber || '—',
          },
          {
            key: 'createdAt', header: 'Date', sortable: true,
            accessor: (b) => b.createdAt,
            render: (b) => new Date(b.createdAt).toLocaleDateString(),
          },
          { key: 'quantity', header: 'Quantity', render: (b) => `${b.quantity} ${b.product?.unit || ''}` },
        ]}
        data={filtered}
        loading={loading}
        searchKeys={['batchNumber']}
        actions={(b) => (
          <div className="flex items-center gap-2">
            <ActionButton variant="validate" size="sm" icon={<Check size={14} />}
              onClick={() => { setAction({ mode: 'validate', batch: b }); setNotes(''); }}>
              Validate
            </ActionButton>
            <ActionButton variant="reject" size="sm" icon={<X size={14} />}
              onClick={() => { setAction({ mode: 'reject', batch: b }); setNotes(''); }}>
              Reject
            </ActionButton>
          </div>
        )}
        empty={{ icon: '✅', title: 'Nothing pending', message: 'No batches awaiting analysis.' }}
      />

      {action && (
        <Modal open onClose={close}
          title={action.mode === 'validate'
            ? `Validate batch ${action.batch.batchNumber}?`
            : `Reject batch ${action.batch.batchNumber}?`}
          footer={(
            <>
              <button className="btn-ghost" onClick={close} disabled={working}>Cancel</button>
              <button onClick={submit} disabled={working}
                className={action.mode === 'validate'
                  ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success-600 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white font-medium hover:bg-danger-600 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }>
                {working ? 'Working…' : (action.mode === 'validate' ? 'Validate & Enter Stock' : 'Reject Batch')}
              </button>
            </>
          )}>
          <div className="space-y-3">
            {action.mode === 'reject' && (
              <div className="rounded-lg bg-warning-50 border border-warning-100 p-3 text-sm text-warning-700">
                {action.batch.origin === 'PRODUCTION'
                  ? 'Rejecting this batch will automatically create a new manufacturing order for rework.'
                  : 'Rejecting this batch will block it in stock.'}
              </div>
            )}
            <div>
              <label className="label-xs block mb-1.5">
                Notes {action.mode === 'reject' && <span className="text-danger">*</span>}
              </label>
              <textarea rows={4} className="input"
                placeholder={action.mode === 'reject' ? 'Explain reason for rejection (required)' : 'Optional analysis notes'}
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
