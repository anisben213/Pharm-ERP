import { useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { batchService } from '../../services/index.js';
import api from '../../services/api.js';

export default function BatchRecalls() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const [picker, setPicker] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);
  const [affected, setAffected] = useState([]);

  const openPicker = () => { setPicker(true); setBatchId(''); setReason(''); setAffected([]); };

  const onPickSubmit = async () => {
    if (!batchId) { toast.warning('Select a batch'); return; }
    if (!reason.trim()) { toast.warning('Enter a reason'); return; }
    setActing(true);
    try {
      // Fetch affected clients (best-effort — endpoint may or may not exist)
      const affectedRes = await api.get(`/batches/${batchId}/affected`).then((r) => r.data).catch(() => ({ clients: [] }));
      setAffected(affectedRes.clients || []);
      setPicker(false);
      setConfirm(true);
    } catch (e) {
      toast.error('Failed to load affected clients');
    } finally { setActing(false); }
  };

  const doRecall = async () => {
    setActing(true);
    try {
      await batchService.recall(batchId, reason);
      toast.success('Recall triggered');
      setConfirm(false);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Recall failed');
    } finally { setActing(false); }
  };

  const recalled = (data || []).filter((b) => String(b.status).toLowerCase() === 'recalled');

  return (
    <div>
      <PageHeader
        title="Batch Recalls"
        subtitle="Trigger and track product recalls."
        actions={<button className="btn-danger" onClick={openPicker}><AlertOctagon size={16} /> Trigger Recall</button>}
      />

      <Table
        loading={loading}
        data={recalled}
        searchKeys={['batchNumber', 'productName', 'reason']}
        columns={[
          { key: 'batchNumber',   header: 'Batch #',   render: (r) => <span className="font-mono text-purple-700">{r.batchNumber}</span> },
          { key: 'productName',   header: 'Product',   render: (r) => r.productName || r.product?.name },
          { key: 'recalledAt',    header: 'Recalled',  render: (r) => r.recalledAt ? new Date(r.recalledAt).toLocaleDateString() : '—' },
          { key: 'reason',        header: 'Reason' },
          { key: 'status',        header: 'Status',    render: () => <Badge status="recalled" /> },
        ]}
        empty={{ icon: '✅', title: 'No active recalls', message: 'Use "Trigger Recall" if a batch needs to be withdrawn.' }}
      />

      <FormModal
        open={picker} onClose={() => setPicker(false)}
        title="Trigger Recall"
        destructive
        submitLabel="Continue"
        loading={acting}
        onSubmit={onPickSubmit}
      >
        <SelectField label="Batch" name="batch" required value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          options={(data || []).filter((b) => String(b.status).toLowerCase() !== 'recalled')
            .map((b) => ({ value: b.id, label: `${b.batchNumber} — ${b.product?.name || b.productName || ''}` }))}
        />
        <label className="block text-sm font-medium text-ink-800 mb-1.5">Reason <span className="text-danger">*</span></label>
        <textarea className="input min-h-[80px]" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FormModal>

      <ConfirmModal
        open={!!confirm} onClose={() => setConfirm(false)}
        title="Confirm recall"
        confirmLabel="Yes, recall batch"
        loading={acting}
        onConfirm={doRecall}
        message={(
          <>
            <span className="block mb-2">This will mark the batch as recalled and notify all affected clients.</span>
            {affected.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-slate-600 max-h-40 overflow-y-auto">
                {affected.map((c, i) => <li key={i}>{c.name || c}</li>)}
              </ul>
            ) : <span className="text-xs text-slate-500">No clients affected (or list unavailable).</span>}
          </>
        )}
      />
    </div>
  );
}
