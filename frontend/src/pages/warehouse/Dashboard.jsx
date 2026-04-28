import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { stockService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function WarehouseDashboard() {
  const { user } = useAuth();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { data, loading } = useFetch(() => stockService.movements().then((r) => r.movements), []);

  const movements = data || [];
  const mine = movements.filter((m) => (m.user?.id || m.userId) === user?.id);
  const todayCount = mine.filter((m) => new Date(m.createdAt || m.date) >= today).length;
  const pendingCount = movements.filter((m) => String(m.status || '').toLowerCase() === 'pending').length;

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle={`Hello, ${user?.fullName || ''}`} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon="📦" label="My Movements Today" value={todayCount}    color="primary" loading={loading} />
        <KPICard icon="⏳" label="Pending To Process" value={pendingCount}   color="warning" loading={loading} />
        <KPICard icon="🏢" label="Storage Capacity"   value="78%"            color="success" />
      </div>
    </div>
  );
}
