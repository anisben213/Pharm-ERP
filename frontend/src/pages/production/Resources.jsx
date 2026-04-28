import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import useFetch from '../../hooks/useFetch.js';
import { userService } from '../../services/index.js';

export default function Resources() {
  const { data, loading } = useFetch(() => userService.list().then((r) => r.users).catch(() => []), []);
  return (
    <div>
      <PageHeader title="Resources" subtitle="Operators and equipment available for production." />
      <Table
        loading={loading}
        data={(data || []).filter((u) => String(u.role).toLowerCase().includes('production'))}
        searchKeys={['fullName', 'email']}
        columns={[
          { key: 'fullName', header: 'Name',  sortable: true },
          { key: 'email',    header: 'Email' },
          { key: 'role',     header: 'Role' },
        ]}
        empty={{ icon: '👥', title: 'No resources', message: 'No production operators are currently assigned.' }}
      />
    </div>
  );
}
