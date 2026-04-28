import { useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { batchService } from '../../services/index.js';

const TABS = [
  { key: 'pending',   label: 'Pending' },
  { key: 'validated', label: 'Validated' },
  { key: 'rejected',  label: 'Rejected' },
];

export default function BatchValidation() {
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const { data, loading, refetch } = useFetch(() => batchService.list().then((r) => r.batches), []);

  const filtered = useMemo(
    () => (data || []).filter((b) => String(b.status).toLowerCase() === tab),
    [data, tab]
  );

  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const validate = async (batch) => {
    setActing(true);
    try {
      await batchService.updateStatus(batch.id, { status: 'VALIDATED' });
      toast.success(`Batch ${batch.batchNumber} validated`);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Validation failed');
    } finally { setActing(false); }
  };

  const reject = async () => {
    if (!reason.trim()) { toast.warning('Please enter a rejection reason'); return; }
    setActing(true);
    try {
      await batchService.updateStatus(rejecting.id, { status: 'REJECTED', reason });
      toast.success(`Batch ${rejecting.batchNumber} rejected`);
      setRejecting(null); setReason('');
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Rejection failed');
    } finally { setActing(false); }
  };

  return (
    <div>
      <PageHeader title="Batch Validation" subtitle="Approve or reject batches based on QC results." />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-card w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              tab === t.key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {loading ? <Skeleton lines={4} />
        : filtered.length === 0
          ? <EmptyState icon="✅" title={`No ${tab} batches`} message="There is nothing in this category right now." />
          : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((b) => (
                <div key={b.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-primary text-lg">{b.batchNumber}</div>
                      <div className="text-sm text-slate-600">{b.product?.name || b.productName}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Manufactured: {b.manufacturedAt ? new Date(b.manufacturedAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <Badge status={b.status} />
                  </div>

                  {b.analysisSummary && (
                    <p className="text-sm text-slate-600 mt-3">{b.analysisSummary}</p>
                  )}

                  {tab === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button className="btn-success" onClick={() => validate(b)} disabled={acting}>✓ Validate</button>
                      <button className="btn-danger" onClick={() => setRejecting(b)} disabled={acting}>✕ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

      <FormModal
        open={!!rejecting} onClose={() => { setRejecting(null); setReason(''); }}
        title={`Reject ${rejecting?.batchNumber || ''}`}
        onSubmit={reject}
        loading={acting}
        destructive
        submitLabel="Reject batch"
      >
        <label className="block text-sm font-medium text-ink-800 mb-1.5">Reason <span className="text-danger">*</span></label>
        <textarea
          className="input min-h-[100px]"
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this batch is being rejected…"
        />
      </FormModal>
    </div>
  );
}
