import { useState } from 'react';
import { Plus, Pencil, X, Check } from 'lucide-react';
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

const BACKEND_ROLES = ['ADMIN', 'PURCHASER', 'STOCK_MANAGER', 'WAREHOUSE_KEEPER', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER', 'LAB_TECHNICIAN', 'SALES_AGENT'];

export default function Users() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => userService.list().then((r) => r.users), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STOCK_MANAGER' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm({ fullName: '', email: '', password: '', role: 'STOCK_MANAGER' }); setErrors({}); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ fullName: u.fullName || '', email: u.email, password: '', role: u.role }); setErrors({}); setOpen(true); };

  const submit = async () => {
    const e = {};
    if (!form.fullName) e.fullName = { message: 'Name is required', show: true };
    if (!form.email || !/.+@.+/.test(form.email)) e.email = { message: 'Valid email required', show: true };
    if (!editing && (!form.password || form.password.length < 6)) e.password = { message: 'Password ≥ 6 chars', show: true };
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (editing) {
        const body = { fullName: form.fullName, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        await userService.update(editing.id, body);
        toast.success('User updated');
      } else {
        await userService.create({ fullName: form.fullName, email: form.email, password: form.password, role: form.role });
        toast.success('User created');
      }
      setOpen(false); refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await userService.update(u.id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      refetch();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        actions={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add User</button>}
      />

      <Table
        loading={loading} data={data || []}
        searchKeys={['fullName', 'email']}
        filters={[{ key: 'role', label: 'All roles', options: BACKEND_ROLES.map((r) => ({ value: r, label: r })) }]}
        columns={[
          { key: 'avatar', header: '', render: (r) => (
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              {(r.fullName || r.email || '?').slice(0, 1).toUpperCase()}
            </div>
          )},
          { key: 'fullName', header: 'Full Name',  sortable: true, render: (r) => r.fullName || '—' },
          { key: 'email',    header: 'Email',       sortable: true },
          { key: 'role',     header: 'Role',        render: (r) => <Badge status="info" label={r.role} /> },
          { key: 'isActive', header: 'Status',      render: (r) => <Badge status={r.isActive === false ? 'inactive' : 'active'} label={r.isActive === false ? 'Inactive' : 'Active'} /> },
          { key: 'lastLoginAt', header: 'Last Login', render: (r) => r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString() : '\u2014' },
        ]}
        actions={(r) => (
          <div className="flex gap-1 justify-center">
            <IconButton icon={<Pencil size={15} />} title="Edit" color="primary" onClick={() => openEdit(r)} />
            <IconButton
              icon={r.isActive === false ? <Check size={15} /> : <X size={15} />}
              title={r.isActive === false ? 'Activate' : 'Deactivate'}
              color={r.isActive === false ? 'success' : 'danger'}
              onClick={() => setConfirm(r)}
            />
          </div>
        )}
        empty={{ icon: '👥', title: 'No users', message: 'Add your first user.', action: <button className="btn-primary" onClick={openCreate}>Add User</button> }}
      />

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit User' : 'Add User'} onSubmit={submit} loading={saving}>
        <InputField label="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
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
        danger={confirm?.isActive !== false}
        title={confirm?.isActive === false ? 'Activate user' : 'Deactivate user'}
        confirmLabel={confirm?.isActive === false ? 'Activate' : 'Deactivate'}
        message={`Are you sure you want to ${confirm?.isActive === false ? 'activate' : 'deactivate'} ${confirm?.fullName || confirm?.email}?`}
      />
    </div>
  );
}
