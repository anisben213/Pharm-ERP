import { useState, useMemo } from 'react';
import { ArrowLeftRight, Plus, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { stockService, batchService } from '../../services/index.js';

const BLOCKED_STATUSES = ['RECALLED', 'EXPIRED', 'SOLD', 'REJECTED'];

export default function StockMovements() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => stockService.movements().then((r) => r.movements), []);
  const { data: batches } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batchNumber: '', type: 'IN', quantity: '', reference: '', note: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedBatch = useMemo(
    () => (batches || []).find((b) => b.batchNumber === form.batchNumber) || null,
    [batches, form.batchNumber],
  );

  const batchWarning = useMemo(() => {
    if (!selectedBatch) return null;
    if (BLOCKED_STATUSES.includes(selectedBatch.status))
      return `This batch is ${selectedBatch.status.toLowerCase()} and cannot be moved.`;
    if (form.type === 'OUT' && Number(selectedBatch.remainingQty ?? 0) <= 0)
      return 'This batch has no remaining quantity for an exit movement.';
    return null;
  }, [selectedBatch, form.type]);

  const validate = () => {
    const e = {};
    if (!form.batchNumber) e.batchNumber = { message: 'Batch number is required', show: true };
    if (!form.type) e.type = { message: 'Type is required', show: true };
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = { message: 'Quantity must be > 0', show: true };
    if (selectedBatch && BLOCKED_STATUSES.includes(selectedBatch.status))
      e.batchNumber = { message: `Batch is ${selectedBatch.status.toLowerCase()} — movement not allowed`, show: true };
    if (selectedBatch && form.type === 'OUT' && Number(selectedBatch.remainingQty ?? 0) <= 0)
      e.quantity = { message: 'Insufficient remaining quantity in this batch', show: true };
    return e;
  };

  const submit = async () => {
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      await stockService.createMovement({ ...form, quantity: Number(form.quantity) });
      toast.success('Movement recorded');
      setOpen(false);
      setForm({ batchNumber: '', type: 'IN', quantity: '', reference: '', note: '' });
      setErrors({});
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to record movement');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle="Inbound and outbound movements with full traceability."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Record Movement</button>}
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['batchNumber', 'productName', 'note', 'reference']}
        filters={[{ key: 'typeGroup', label: 'All types', options: [
          { value: 'IN', label: 'Entry' },
          { value: 'OUT', label: 'Exit' },
        ]}]}
        columns={[
          { key: 'createdAt',   header: 'Date',         sortable: true, render: (r) => new Date(r.createdAt || r.date).toLocaleString() },
          { key: 'productName', header: 'Product',      sortable: true, render: (r) => r.productName || r.product?.name || '—' },
          { key: 'batchNumber', header: 'Batch #',      render: (r) => r.batchNumber ? <span className="font-mono text-primary">{r.batchNumber}</span> : '—' },
          { key: 'type',        header: 'Type',         render: (r) => <Badge status={r.typeGroup === 'IN' ? 'active' : 'pending'} label={r.type?.replace('_', ' ') || r.type} /> },
          { key: 'quantity',    header: 'Qty',          sortable: true, render: (r) => <span className="font-mono">{r.quantity}</span> },
          { key: 'note',        header: 'Note',         render: (r) => r.note && r.note !== '—' ? r.note : <span className="text-slate-400 text-xs">—</span> },
        ]}
        empty={{ icon: <ArrowLeftRight size={40} />, title: 'No movements yet', message: 'Record your first stock movement to get started.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Record Movement</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title="Record Movement" onSubmit={submit} loading={saving} submitLabel="Record">
        <SelectField label="Batch" name="batchNumber" required value={form.batchNumber}
          onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
          options={(batches || []).map((b) => ({
            value: b.batchNumber,
            label: `${b.batchNumber} — ${b.product?.name || ''} (${b.status})`,
          }))}
          error={errors.batchNumber}
        />
        {batchWarning && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {batchWarning}
          </div>
        )}
        {selectedBatch && !batchWarning && (
          <div className="text-xs text-slate-500 -mt-2">
            Remaining qty: <span className="font-mono font-medium text-slate-700">{Number(selectedBatch.remainingQty).toLocaleString()}</span>
            {' · '}Status: <span className="font-medium">{selectedBatch.status}</span>
          </div>
        )}
        <SelectField label="Type" name="type" required value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={[{ value: 'IN', label: 'Entry (+)' }, { value: 'OUT', label: 'Exit (-)' }]}
          error={errors.type}
        />
        <InputField label="Quantity" name="quantity" type="number" min="0" step="any" required
          value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          error={errors.quantity}
        />
        <InputField label="Reference" name="reference" value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          hint="Optional: document or order reference (e.g. PO-2026-001)"
        />
        <InputField label="Note" name="note" value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          hint="Optional: reason for this adjustment"
        />
      </FormModal>
    </div>
  );
}
