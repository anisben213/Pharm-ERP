import { useEffect, useState } from 'react';
import { userService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';

const ROLES = ['ADMIN', 'PURCHASER', 'STOCK_MANAGER', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER', 'SALES_AGENT'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'SALES_AGENT' });
  const [error, setError] = useState('');

  const load = () =>
    userService.list().then((d) => setUsers(d.users || [])).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await userService.create(form);
      setOpen(false);
      setForm({ email: '', fullName: '', password: '', role: 'SALES_AGENT' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const disable = async (u) => {
    if (!confirm(`Disable user ${u.email}?`)) return;
    await userService.remove(u.id);
    load();
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'fullName', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.isActive ? (
          <Button variant="danger" onClick={() => disable(r)}>Disable</Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="User and role management">
        <Button onClick={() => setOpen(true)}>New User</Button>
      </PageHeader>
      {loading ? <div>Loading…</div> : <Table columns={columns} rows={users} />}

      <Modal open={open} onClose={() => { setOpen(false); setError(''); }} title="Create User">
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>}
          <input required placeholder="Email" type="email" className="w-full border rounded px-3 py-2"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Full name" className="w-full border rounded px-3 py-2"
            value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input required placeholder="Password" type="password" className="w-full border rounded px-3 py-2"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="w-full border rounded px-3 py-2"
            value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
