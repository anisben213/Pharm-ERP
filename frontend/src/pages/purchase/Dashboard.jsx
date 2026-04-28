import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { purchaseService, supplierService } from '../../services/index.js';

export default function PurchaseDashboard() {
  const { data: orders, loading: lo } = useFetch(() => purchaseService.list().then((r) => r.orders), []);
  const { data: suppliers, loading: ls } = useFetch(() => supplierService.list().then((r) => r.suppliers).catch(() => []), []);

  const all = orders || [];
  const pending = all.filter((o) => String(o.status).toLowerCase() === 'pending').length;
  const inProgress = all.filter((o) => String(o.status).toLowerCase() === 'in_progress' || String(o.status).toLowerCase() === 'sent').length;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const receivedThisMonth = all.filter((o) =>
    String(o.status).toLowerCase() === 'received' && new Date(o.receivedAt || o.updatedAt || 0) >= monthStart
  ).length;

  return (
    <div>
      <PageHeader title="Purchase Dashboard" subtitle="Procurement pipeline & supplier overview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="📝" label="Pending Requests"       value={pending}            color="warning" loading={lo} />
        <KPICard icon="📦" label="Orders In Progress"     value={inProgress}         color="primary" loading={lo} />
        <KPICard icon="✅" label="Received This Month"    value={receivedThisMonth}  color="success" loading={lo} />
        <KPICard icon="🏭" label="Suppliers"              value={(suppliers || []).length} color="gray"    loading={ls} />
      </div>
    </div>
  );
}
