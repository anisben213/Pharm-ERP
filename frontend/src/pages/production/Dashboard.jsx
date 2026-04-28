import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productionService } from '../../services/index.js';

export default function ProductionDashboard() {
  const { data, loading } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const orders = data || [];
  const byStatus = (s) => orders.filter((o) => String(o.status).toLowerCase() === s).length;

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const completedThisMonth = orders.filter((o) =>
    String(o.status).toLowerCase() === 'completed' && new Date(o.completedAt || o.updatedAt || 0) >= monthStart
  ).length;
  const batchesGenerated = orders.filter((o) => o.batchNumber).length;

  return (
    <div>
      <PageHeader title="Production Dashboard" subtitle="Track manufacturing orders and batch generation." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="🏭" label="Orders In Progress"        value={byStatus('in_progress')} color="primary" loading={loading} />
        <KPICard icon="✅" label="Completed This Month"      value={completedThisMonth}       color="success" loading={loading} />
        <KPICard icon="⏳" label="Pending Orders"            value={byStatus('pending')}      color="warning" loading={loading} />
        <KPICard icon="🏷️" label="Batches Generated"         value={batchesGenerated}         color="purple"  loading={loading} />
      </div>
    </div>
  );
}
