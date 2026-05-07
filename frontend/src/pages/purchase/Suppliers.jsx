import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal, { ConfirmModal } from '../../components/common/Modal.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { supplierService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function Suppliers() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSuppliers(await supplierService.list()); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    setWorking(true);
    try {
      await supplierService.remove(deleting.id);
      toast.success(`Supplier "${deleting.name}" removed`);
      setDeleting(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to remove supplier'); }
    finally { setWorking(false); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'contact', header: 'Contact' },
          { key: 'email', header: 'Email' },
        ]}
        data={suppliers}
        loading={loading}
        searchKeys={['name', 'contact', 'email']}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setModal({ mode: 'create' })}>
            Add Supplier
          </ActionButton>
        )}
        actions={(s) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton variant="view" size="sm" icon={<Pencil size={14} />} onClick={() => setModal({ mode: 'edit', supplier: s })}>
              Edit
            </ActionButton>
            <ActionButton variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleting(s)}>
              Remove
            </ActionButton>
          </div>
        )}
        empty={{ icon: '🏢', title: 'No suppliers', message: 'Add your first supplier.' }}
      />

      {modal && <SupplierModal mode={modal.mode} supplier={modal.supplier}
        onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove supplier?"
        message={`"${deleting?.name}" will be permanently deleted. This is only possible if the supplier has no purchase orders.`}
        confirmLabel="Remove"
        loading={working}
      />
    </div>
  );
}

function SupplierModal({ mode, supplier, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: supplier?.name || '',
    contact: supplier?.contact || '',
    email: supplier?.email || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'create') { await supplierService.create(form); toast.success('Supplier added'); }
      else { await supplierService.update(supplier.id, form); toast.success('Supplier updated'); }
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open onClose={onClose}
      title={mode === 'create' ? 'Add Supplier' : `Edit ${supplier?.name}`}
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="sup-form" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      )}>
      <form id="sup-form" onSubmit={submit} className="space-y-4">
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
      </form>
    </Modal>
  );
}
