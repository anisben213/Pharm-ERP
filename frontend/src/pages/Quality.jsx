import { useEffect, useState } from 'react';
import { qualityService, batchService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Quality() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ batchId: '', result: 'PASSED', notes: '' });
  const [error, setError] = useState('');

  const load = () =>
    qualityService.list().then((d) => setChecks(d.checks || [])).finally(() => setLoading(false));

  useEffect(() => {
    load();
    batchService.list({ status: 'IN_QUARANTINE' }).then((d) => setBatches(d.batches || []));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await qualityService.inspect(form);
      setOpen(false);
      setForm({ batchId: '', result: 'PASSED', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit inspection');
    }
  };

  const columns = [
    { key: 'batch', label: 'Batch #', render: (r) => r.batch?.batchNumber },
    { key: 'result', label: 'Result', render: (r) => <StatusBadge value={r.result} /> },
    { key: 'notes', label: 'Notes' },
    { key: 'inspectedAt', label: 'Inspected', render: (r) => r.inspectedAt?.slice(0, 16).replace('T', ' ') },
  ];

  return (
    <div>
      <PageHeader title="Quality Control" subtitle="Inspection and release">
        <Button onClick={() => setOpen(true)}>New Inspection</Button>
      </PageHeader>
      {loading ? <div>Loading…</div> : <Table columns={columns} rows={checks} />}

      <Modal open={open} onClose={() => { setOpen(false); setError(''); }} title="New QC Inspection">
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Batch (in quarantine)</label>
            <select
              required
              className="w-full border rounded px-3 py-2"
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
            >
              <option value="">-- Select --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batchNumber} — {b.product?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Result</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
            >
              <option>PASSED</option>
              <option>FAILED</option>
              <option>PENDING</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
