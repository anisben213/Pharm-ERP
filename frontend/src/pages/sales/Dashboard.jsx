import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { salesService } from '../../services/index.js';

export default function SalesDashboard() {
  const { data, loading } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const all = data || [];
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = all.filter((o) => new Date(o.createdAt || 0) >= monthStart);
  const ordersThisMonth = thisMonth.length;
  const revenue = thisMonth.reduce((acc, o) => acc + Number(o.totalAmount ?? o.total ?? 0), 0);
  const pendingDeliveries = all.filter((o) => String(o.status).toLowerCase() === 'pending' || String(o.status).toLowerCase() === 'in_progress').length;
  const returns = all.filter((o) => String(o.status).toLowerCase() === 'returned').length;

  return (
    <div>
      <PageHeader title="Sales Dashboard" subtitle="Pipeline, revenue and post-sale activity." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="🛒" label="Orders This Month"   value={ordersThisMonth}                                            color="primary" loading={loading} />
        <KPICard icon="💰" label="Revenue This Month"  value={revenue.toLocaleString(undefined,{minimumFractionDigits:2})} color="success" loading={loading} />
        <KPICard icon="🚚" label="Pending Deliveries"  value={pendingDeliveries}                                          color="warning" loading={loading} />
        <KPICard icon="↩️" label="Returns This Month"  value={returns}                                                    color="danger"  loading={loading} />
      </div>
    </div>
  );
}
