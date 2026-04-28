import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { userService } from '../../services/index.js';
import { ROLE_KEYS, ROLE_LABEL } from '../../utils/roles.js';

const BACKEND_ROLES = ['ADMIN', 'PURCHASER', 'STOCK_MANAGER', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER', 'SALES_AGENT'];

export default function Users() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => userService.list().then((r) => r.users), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STOCK_MANAGER' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'STOCK_MANAGER' }); setErrors({}); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name || '', email: u.email, password: '', role: u.role }); setErrors({}); setOpen(true); };

  const submit = async () => {
    const e = {};
    if (!form.name) e.name = { message: 'Name is required', show: true };
    if (!form.email || !/.+@.+/.test(form.email)) e.email = { message: 'Valid email required', show: true };
    if (!editing && (!form.password || form.password.length < 6)) e.password = { message: 'Password ≥ 6 chars', show: true };
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (editing) {
        const body = { name: form.name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        await userService.update(editing.id, body);
        toast.success('User updated');
      } else {
        await userService.create(form);
        toast.success('User created');
      }
      setOpen(false); refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await userService.update(u.id, { active: !u.active });
      toast.success(u.active ? 'User deactivated' : 'User activated');
      refetch();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        actions={<button className="btn-primary" onClick={openCreate}>➕ Add User</button>}
      />

      <Table
        loading={loading} data={data || []}
        searchKeys={['name', 'email']}
        filters={[{ key: 'role', label: 'All roles', options: BACKEND_ROLES.map((r) => ({ value: r, label: r })) }]}
        columns={[
          { key: 'avatar', header: '', render: (r) => (
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              {(r.name || r.email || '?').slice(0, 1).toUpperCase()}
            </div>
          )},
          { key: 'name',  header: 'Name',     sortable: true, render: (r) => r.name || '—' },
          { key: 'email', header: 'Email',    sortable: true },
          { key: 'role',  header: 'Role',     render: (r) => <Badge status="info" label={r.role} /> },
          { key: 'active', header: 'Status',  render: (r) => <Badge status={r.active === false ? 'inactive' : 'active'} label={r.active === false ? 'Inactive' : 'Active'} /> },
          { key: 'lastLogin', header: 'Last Login', render: (r) => r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString() : '—' },
        ]}
        actions={(r) => (
          <div className="flex gap-1">
            <IconButton icon="✏️" title="Edit" color="primary" onClick={() => openEdit(r)} />
            <IconButton
              icon={r.active === false ? '✓' : '⊘'}
              title={r.active === false ? 'Activate' : 'Deactivate'}
              color={r.active === false ? 'success' : 'danger'}
              onClick={() => setConfirm(r)}
            />
          </div>
        )}
        empty={{ icon: '👥', title: 'No users', message: 'Add your first user.', action: <button className="btn-primary" onClick={openCreate}>Add User</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit User' : 'Add User'} onSubmit={submit} loading={saving}>
        <InputField label="Name"  required value={form.name}  onChange={(e) => setForm({ ...form, name: e.target.value })}  error={errors.name} />
        <InputField label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <InputField label={editing ? 'New password (leave blank to keep)' : 'Password'} type="password" required={!editing}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <SelectField label="Role" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={BACKEND_ROLES.map((r) => ({ value: r, label: r }))}
        />
      </FormModal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { toggleActive(confirm); setConfirm(null); }}
        danger={confirm?.active !== false}
        title={confirm?.active === false ? 'Activate user' : 'Deactivate user'}
        confirmLabel={confirm?.active === false ? 'Activate' : 'Deactivate'}
        message={`Are you sure you want to ${confirm?.active === false ? 'activate' : 'deactivate'} ${confirm?.email}?`}
      />
    </div>
  );
}
