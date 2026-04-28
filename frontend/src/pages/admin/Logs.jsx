import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { logsService } from '../../services/index.js';

export default function Logs() {
  const { data, loading } = useFetch(() => logsService.list().then((r) => r.logs).catch(() => []), []);
  return (
    <div>
      <PageHeader title="System Logs" subtitle="Audit trail of all user actions." />
      <Table
        loading={loading} data={data || []}
        searchKeys={['action', 'message', 'userEmail']}
        filters={[
          { key: 'level', label: 'All levels', options: [
            { value: 'info', label: 'Info' },
            { value: 'warn', label: 'Warning' },
            { value: 'error', label: 'Error' },
          ]},
        ]}
        columns={[
          { key: 'createdAt', header: 'Timestamp', sortable: true, render: (r) => new Date(r.createdAt || r.timestamp).toLocaleString() },
          { key: 'level',     header: 'Level',     render: (r) => <Badge status={r.level === 'error' ? 'rejected' : r.level === 'warn' ? 'pending' : 'info'} label={(r.level || 'info').toUpperCase()} /> },
          { key: 'userEmail', header: 'User',      render: (r) => r.user?.email || r.userEmail || 'system' },
          { key: 'action',    header: 'Action',    render: (r) => r.action || r.message },
          { key: 'ip',        header: 'IP',        render: (r) => r.ip || '—' },
        ]}
        empty={{ icon: '📜', title: 'No logs', message: 'Activity will be recorded here.' }}
      />
    </div>
  );
}
