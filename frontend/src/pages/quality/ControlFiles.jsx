import { useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { qualityService, batchService } from '../../services/index.js';

export default function ControlFiles() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => qualityService.list().then((r) => r.checks), []);
  const { data: batches } = useFetch(() => batchService.list().then((r) => r.batches), []);

  const [open, setOpen] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [result, setResult] = useState('PENDING');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!batchId) { toast.warning('Select a batch'); return; }
    setSaving(true);
    try {
      await qualityService.inspect({ batchId, result, notes });
      toast.success('Control file created');
      setOpen(false);
      setBatchId(''); setResult('PENDING'); setNotes('');
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create control file');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Control Files"
        subtitle="QC inspection records per batch."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Control File</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['batchNumber', 'productName']}
        filters={[{ key: 'result', label: 'All results', options: [
          { value: 'PASSED',  label: 'Passed' },
          { value: 'FAILED',  label: 'Failed' },
          { value: 'PENDING', label: 'Pending' },
        ]}]}
        columns={[
          { key: 'batchNumber', header: 'Batch #',    render: (r) => <span className="font-mono text-primary">{r.batch?.batchNumber || r.batchNumber || '—'}</span> },
          { key: 'product',     header: 'Product',    render: (r) => r.batch?.product?.name || '—' },
          { key: 'result',      header: 'Result',     render: (r) => <Badge status={r.result} /> },
          { key: 'inspectedBy', header: 'Inspector',  render: (r) => r.inspectedBy?.fullName || '—' },
          { key: 'inspectedAt', header: 'Date',       sortable: true, render: (r) => new Date(r.inspectedAt).toLocaleDateString() },
          { key: 'notes',       header: 'Notes',      render: (r) => r.notes ? <span className="text-sm text-slate-600 truncate max-w-xs block">{r.notes}</span> : <span className="text-slate-400 text-xs">—</span> },
        ]}
        empty={{ icon: <FolderOpen size={40} />, title: 'No control files', message: 'Create your first control file for a batch.', action: <button className="btn-primary" onClick={() => setOpen(true)}>New Control File</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title="New Control File" onSubmit={submit} loading={saving} submitLabel="Create">
        <SelectField label="Batch" required value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          options={(batches || []).map((b) => ({ value: b.id, label: `${b.batchNumber} — ${b.product?.name || ''} (${b.status})` }))}
        />
        <SelectField label="Initial Result" value={result}
          onChange={(e) => setResult(e.target.value)}
          options={[
            { value: 'PENDING', label: 'Pending (lab analysis ongoing)' },
            { value: 'PASSED',  label: 'Passed' },
            { value: 'FAILED',  label: 'Failed' },
          ]}
        />
        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">Notes</label>
          <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, parameters tested…" />
        </div>
      </FormModal>
    </div>
  );
}

