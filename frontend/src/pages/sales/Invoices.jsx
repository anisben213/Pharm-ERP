import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { salesService } from '../../services/index.js';

export default function Invoices() {
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const invoices = (data || []).filter((o) => ['DELIVERED', 'CONFIRMED'].includes(o.status));
  return (
    <div>
      <PageHeader title="Invoices" subtitle="Billing records for confirmed and delivered orders." />
      <Table
        loading={loading} data={invoices}
        searchKeys={['reference']}
        filters={[{ key: 'status', label: 'All statuses', options: [
          { value: 'CONFIRMED', label: 'Confirmed' },
          { value: 'DELIVERED', label: 'Delivered' },
        ]}]}
        columns={[
          { key: 'reference', header: 'Order #', render: (r) => <span className="font-mono">{r.reference || r.id}</span> },
          { key: 'customer',  header: 'Client',  render: (r) => r.customer?.name || '—' },
          { key: 'createdAt', header: 'Issued',  sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
          { key: 'total', header: 'Amount', sortable: true, render: (r) => {
            const t = (r.lines || []).reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0);
            return t.toLocaleString(undefined, { minimumFractionDigits: 2 });
          }},
          { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} label={r.status} /> },
        ]}
        actions={(r) => <IconButton icon={<Eye size={15} />} title="View order" color="primary" onClick={() => navigate(`/sales_manager/orders/${r.id}`)} />}
        empty={{ icon: '🧾', title: 'No invoices', message: 'No invoices yet.' }}
      />
    </div>
  );
}
