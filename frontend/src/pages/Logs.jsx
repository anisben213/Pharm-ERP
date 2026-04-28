import { useEffect, useState } from 'react';
import { logsService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity: '', action: '' });

  const load = () => {
    setLoading(true);
    logsService.list({ ...filters, limit: 200 })
      .then((d) => setLogs(d.logs || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'createdAt', label: 'Date', render: (r) => r.createdAt?.slice(0, 19).replace('T', ' ') },
    { key: 'user', label: 'User', render: (r) => r.user?.email || '—' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'ip', label: 'IP' },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="System-wide activity trail" />
      <div className="flex gap-2 mb-4">
        <input placeholder="Entity"
          className="border rounded px-3 py-2"
          value={filters.entity}
          onChange={(e) => setFilters({ ...filters, entity: e.target.value })} />
        <input placeholder="Action"
          className="border rounded px-3 py-2"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
        <button onClick={load} className="bg-blue-600 text-white px-4 rounded">Apply</button>
      </div>
      {loading ? <div>Loading…</div> : <Table columns={columns} rows={logs} />}
    </div>
  );
}
