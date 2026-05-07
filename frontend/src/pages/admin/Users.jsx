import { useEffect, useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { userService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'STOCK_MANAGER', label: 'Stock Manager' },
  { value: 'PRODUCTION_MANAGER', label: 'Production Manager' },
  { value: 'PURCHASE_MANAGER', label: 'Purchase Manager' },
  { value: 'QUALITY_MANAGER', label: 'Quality Manager' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
];

const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]));

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', user }

  const load = async () => {
    setLoading(true);
    try { setUsers(await userService.list()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (u) => {
    try {
      if (u.isActive) await userService.deactivate(u.id);
      else await userService.activate(u.id);
      toast.success(`User ${u.username} ${u.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'username', header: 'Username', sortable: true },
          { key: 'fullName', header: 'Full Name', sortable: true },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role', render: (u) => <StatusBadge status={u.role} /> },
          { key: 'isActive', header: 'Status', render: (u) => (
            <span className={u.isActive ? 'text-success-700' : 'text-slate-400'}>
              {u.isActive ? 'Active' : 'Inactive'}
            </span>
          ) },
        ]}
        data={users}
        loading={loading}
        searchKeys={['username', 'fullName', 'email']}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setModal({ mode: 'create' })}>
            Add User
          </ActionButton>
        )}
        actions={(u) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton variant="view" size="sm" icon={<Pencil size={14} />} onClick={() => setModal({ mode: 'edit', user: u })}>
              Edit
            </ActionButton>
            <ActionButton variant={u.isActive ? 'danger' : 'validate'} size="sm"
              icon={u.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
              onClick={() => toggle(u)}>
              {u.isActive ? 'Deactivate' : 'Activate'}
            </ActionButton>
          </div>
        )}
        empty={{ icon: '👥', title: 'No users', message: 'Add your first user to get started.' }}
      />

      {modal && (
        <UserFormModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

function UserFormModal({ mode, user, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    role: user?.role || 'STOCK_MANAGER',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await userService.create(form);
        toast.success('User created');
      } else {
        const update = { ...form };
        if (!update.password) delete update.password;
        delete update.username;
        await userService.update(user.id, update);
        toast.success('User updated');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? 'Add User' : `Edit ${user?.username}`}
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="user-form" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      )}
    >
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label-xs block mb-1.5">Username</label>
          <input className="input" required value={form.username} disabled={mode === 'edit'}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Full Name</label>
          <input className="input" required value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Email</label>
          <input type="email" className="input" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-xs block mb-1.5">
            Password {mode === 'edit' && <span className="text-slate-400">(leave blank to keep)</span>}
          </label>
          <input type="password" className="input" minLength={8}
            required={mode === 'create'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
