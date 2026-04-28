import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function LabDashboard() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const all = data || [];
  const assigned = all.length;
  const pending = all.filter((b) => String(b.status).toLowerCase() === 'pending').length;
  const validatedThisMonth = all.filter((b) => {
    if (String(b.status).toLowerCase() !== 'validated') return false;
    const d = new Date(b.validatedAt || b.updatedAt || 0);
    const ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
    return d >= ms;
  }).length;

  return (
    <div>
      <PageHeader title="Lab Dashboard" subtitle="Your daily QC workload at a glance." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon="📁" label="Assigned Files"          value={assigned}             color="primary" loading={loading} />
        <div className={pending > 0 ? 'ring-2 ring-warning rounded-xl' : ''}>
          <KPICard icon="⏳" label="Results Pending Entry" value={pending}              color="warning" loading={loading} />
        </div>
        <KPICard icon="📄" label="Certificates This Month" value={validatedThisMonth}   color="success" loading={loading} />
      </div>
    </div>
  );
}
