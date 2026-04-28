import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { salesService } from '../../services/index.js';

export default function Invoices() {
  const { data, loading } = useFetch(() => salesService.list().then((r) => r.orders), []);
  return (
    <div>
      <PageHeader title="Invoices" subtitle="Billing records for completed orders." />
      <Table
        loading={loading} data={data || []}
        searchKeys={['orderNumber', 'customerName']}
        filters={[{ key: 'paymentStatus', label: 'All payment statuses', options: [
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'overdue', label: 'Overdue' },
        ]}]}
        columns={[
          { key: 'invoiceNumber', header: 'Invoice #',     render: (r) => <span className="font-mono">{r.invoiceNumber || `INV-${r.id}`}</span> },
          { key: 'customerName',  header: 'Client',         render: (r) => r.customer?.name || r.customerName },
          { key: 'createdAt',     header: 'Issued',         sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
          { key: 'totalAmount',   header: 'Amount',         sortable: true, render: (r) => Number(r.totalAmount ?? 0).toLocaleString(undefined,{minimumFractionDigits:2}) },
          { key: 'paymentStatus', header: 'Payment Status', render: (r) => <Badge status={r.paymentStatus || 'pending'} /> },
        ]}
        empty={{ icon: '🧾', title: 'No invoices', message: 'No invoices have been issued yet.' }}
      />
    </div>
  );
}
