import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { clientService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setClients(await clientService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'contact', header: 'Contact' },
          { key: 'email', header: 'Email' },
          { key: 'address', header: 'Address' },
        ]}
        data={clients}
        loading={loading}
        searchKeys={['name', 'contact', 'email']}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setModal({ mode: 'create' })}>
            Add Client
          </ActionButton>
        )}
        actions={(c) => (
          <ActionButton variant="view" size="sm" icon={<Pencil size={14} />}
            onClick={() => setModal({ mode: 'edit', client: c })}>
            Edit
          </ActionButton>
        )}
        empty={{ icon: '🧑‍💼', title: 'No clients', message: 'Add your first client.' }}
      />

      {modal && <ClientModal mode={modal.mode} client={modal.client}
        onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function ClientModal({ mode, client, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: client?.name || '',
    contact: client?.contact || '',
    email: client?.email || '',
    address: client?.address || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'create') { await clientService.create(form); toast.success('Client added'); }
      else { await clientService.update(client.id, form); toast.success('Client updated'); }
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={onClose}
      title={mode === 'create' ? 'Add Client' : `Edit ${client?.name}`}
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="cl-form" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      )}>
      <form id="cl-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label-xs block mb-1.5">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Contact</label>
          <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Address</label>
          <textarea rows={2} className="input" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
