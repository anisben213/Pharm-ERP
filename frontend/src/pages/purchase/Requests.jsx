import { useState } from 'react';
import { FileText, Plus, Check } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import InputField from '../../components/forms/InputField.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { purchaseService, supplierService, productService } from '../../services/index.js';

export default function PurchaseRequests() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => purchaseService.list().then((r) => r.orders), []);
  const { data: suppliers } = useFetch(() => supplierService.list().then((r) => r.suppliers).catch(() => []), []);
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);

  const requests = (data || []).filter((o) => o.status === 'DRAFT');

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: '', unitPrice: '' }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const addLine = () => setLines((ls) => [...ls, { productId: '', quantity: '', unitPrice: '' }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async () => {
    const e = {};
    if (!supplierId) e.supplier = { message: 'Supplier is required', show: true };
    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) e.lines = { message: 'Add at least one product', show: true };
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await purchaseService.create({ supplierId, lines: validLines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice || 0) })) });
      toast.success('Purchase request created');
      setOpen(false);
      setSupplierId(''); setLines([{ productId: '', quantity: '', unitPrice: '' }]); setErrors({});
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create request');
    } finally { setSaving(false); }
  };

  const confirmRequest = async () => {
    try {
      await purchaseService.confirm(confirming.id);
      toast.success('Request converted to purchase order');
      setConfirming(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to confirm');
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase Requests"
        subtitle="Draft purchase requests awaiting conversion to official orders."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Request</button>}
      />

      <Table
        loading={loading}
        data={requests}
        searchKeys={['reference', 'supplierName']}
        columns={[
          { key: 'reference',    header: 'Ref #',     render: (r) => <span className="font-mono">{r.reference || r.id}</span> },
          { key: 'supplier',     header: 'Supplier',  render: (r) => r.supplier?.name || '—' },
          { key: 'createdAt',    header: 'Date',      sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
          { key: 'lines',        header: 'Items',     render: (r) => (r.lines || []).length },
          { key: 'status',       header: 'Status',    render: () => <Badge status="DRAFT" /> },
        ]}
        actions={(r) => (
          <IconButton icon={<Check size={15} />} title="Convert to Order" color="success" onClick={() => setConfirming(r)} />
        )}
        empty={{ icon: <FileText size={40} />, title: 'No pending requests', message: 'Create a purchase request to get started.', action: <button className="btn-primary" onClick={() => setOpen(true)}>New Request</button> }}
      />

      {/* Create request modal */}
      <FormModal open={open} onClose={() => setOpen(false)} title="New Purchase Request" onSubmit={submit} loading={saving} submitLabel="Submit Request" size="lg">
        <SelectField label="Supplier" required value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))}
          error={errors.supplier}
        />
        <div className="space-y-2">
          <div className="label-xs mb-1">Products</div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-6">
                <SelectField label={i === 0 ? 'Product' : ''} value={line.productId}
                  onChange={(e) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, productId: e.target.value } : l))}
                  options={(products || []).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))}
                />
              </div>
              <div className="col-span-3">
                <InputField label={i === 0 ? 'Qty' : ''} type="number" min="0" value={line.quantity}
                  onChange={(e) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, quantity: e.target.value } : l))}
                />
              </div>
              <div className="col-span-2">
                <InputField label={i === 0 ? 'Unit Price' : ''} type="number" min="0" step="0.01" value={line.unitPrice}
                  onChange={(e) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, unitPrice: e.target.value } : l))}
                />
              </div>
              <div className="col-span-1 pb-4">
                {lines.length > 1 && <button type="button" className="text-danger text-lg font-bold cursor-pointer" onClick={() => removeLine(i)}>×</button>}
              </div>
            </div>
          ))}
          {errors.lines && <p className="text-danger text-xs">{errors.lines.message}</p>}
          <button type="button" className="btn-outline text-sm mt-1" onClick={addLine}><Plus size={14} /> Add line</button>
        </div>
      </FormModal>

      {/* Confirm conversion modal */}
      <ConfirmModal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        title="Convert to Purchase Order"
        message={`Convert request ${confirming?.reference} to an official purchase order? This will confirm it with the supplier.`}
        confirmLabel="Convert"
        onConfirm={confirmRequest}
      />
    </div>
  );
}

