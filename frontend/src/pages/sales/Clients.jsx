import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { customerService } from '../../services/index.js';

export default function Clients() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => customerService.list().then((r) => r.customers).catch(() => []), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name) { toast.warning('Name is required'); return; }
    setSaving(true);
    try {
      await customerService.create(form);
      toast.success('Client added');
      setOpen(false); setForm({ name: '', email: '', phone: '', address: '' });
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add client');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>➕ Add Client</button>}
      />

      <Table
        loading={loading} data={data || []}
        searchKeys={['name', 'email', 'phone']}
        columns={[
          { key: 'name',  header: 'Name' },
          { key: 'email', header: 'Email', render: (r) => r.email || '—' },
          { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
          { key: 'address', header: 'Address', render: (r) => r.address || '—' },
        ]}
        empty={{ icon: '👥', title: 'No clients yet', message: 'Add your first client.', action: <button className="btn-primary" onClick={() => setOpen(true)}>Add Client</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title="Add Client" onSubmit={submit} loading={saving} submitLabel="Add">
        <InputField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <InputField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <InputField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <InputField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </FormModal>
    </div>
  );
}
