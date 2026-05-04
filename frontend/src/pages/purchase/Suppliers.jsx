import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { supplierService } from '../../services/index.js';

function Stars({ value = 0, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n} type="button"
          onClick={() => onChange?.(n)}
          className={`text-2xl leading-none cursor-pointer transition-colors ${n <= value ? 'text-warning' : 'text-slate-300 hover:text-warning/60'}`}
        >★</button>
      ))}
    </div>
  );
}

export default function Suppliers() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => supplierService.list().then((r) => r.suppliers).catch(() => []), []);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(null); // {supplier, value}
  const [savingRating, setSavingRating] = useState(false);

  const saveRating = async () => {
    if (!rating?.value) { toast.warning('Select a rating'); return; }
    setSavingRating(true);
    try {
      await supplierService.rate(rating.supplier.id, rating.value);
      toast.success('Rating saved');
      setRating(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save rating');
    } finally { setSavingRating(false); }
  };

  const filtered = (data || []).filter((s) =>
    !search || (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const addSupplier = async () => {
    if (!form.name) { toast.warning('Name is required'); return; }
    setSaving(true);
    try {
      await supplierService.create(form);
      toast.success('Supplier added');
      setAdding(false); setForm({ name: '', email: '', phone: '', address: '' });
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add supplier');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        actions={<button className="btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add Supplier</button>}
      />

      <div className="mb-5">
        <input className="input max-w-md" placeholder="🔍 Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <Skeleton lines={4} />
        : filtered.length === 0
          ? <div className="card"><EmptyState icon={<Building2 size={40} />} title="No suppliers" message="Add your first supplier to start ordering." /></div>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <div key={s.id} className="card">
                  <div className="font-semibold text-ink-800">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.email || '—'}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.phone || '—'}</div>
                  <div className="mt-3"><Stars value={Number(s.rating) || 0} /></div>
                  <div className="text-xs text-slate-500 mt-2 flex justify-between">
                    <span>Orders: {s.ordersCount ?? 0}</span>
                    <span>{s.lastOrderAt ? `Last: ${new Date(s.lastOrderAt).toLocaleDateString()}` : 'No orders'}</span>
                  </div>
                  <button className="btn-outline w-full mt-4" onClick={() => setRating({ supplier: s, value: Number(s.rating) || 0 })}>⭐ Evaluate</button>
                </div>
              ))}
            </div>
          )}

      <FormModal open={adding} onClose={() => setAdding(false)} title="Add Supplier" onSubmit={addSupplier} loading={saving} submitLabel="Add">
        <InputField label="Name"  required value={form.name}  onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <InputField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <InputField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <InputField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </FormModal>

      <FormModal
        open={!!rating} onClose={() => setRating(null)}
        title={`Evaluate ${rating?.supplier?.name || ''}`}
        onSubmit={saveRating}
        submitLabel="Save"
        loading={savingRating}
      >
        <p className="text-sm text-slate-600 mb-3">Rate this supplier:</p>
        <Stars value={rating?.value || 0} onChange={(v) => setRating((r) => ({ ...r, value: v }))} />
      </FormModal>
    </div>
  );
}
