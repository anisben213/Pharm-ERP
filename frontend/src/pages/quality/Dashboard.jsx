import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

export default function QualityDashboard() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const all = data || [];
  const pending  = all.filter((b) => String(b.status).toLowerCase() === 'pending').length;
  const rejected = all.filter((b) => String(b.status).toLowerCase() === 'rejected').length;
  const recalled = all.filter((b) => String(b.status).toLowerCase() === 'recalled').length;
  const validated = all.filter((b) => String(b.status).toLowerCase() === 'validated').length;
  const total = validated + rejected;
  const conformity = total > 0 ? Math.round((validated / total) * 100) : 100;

  return (
    <div>
      <PageHeader title="Quality Dashboard" subtitle="Validation backlog, conformity and recalls." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={pending > 0 ? 'ring-2 ring-warning rounded-xl' : ''}>
          <KPICard icon="⏳" label="Pending Validation" value={pending}     color="warning" loading={loading} />
        </div>
        <KPICard icon="❌" label="Non-Conformities Open" value={rejected}    color="danger"  loading={loading} />
        <KPICard icon="✅" label="Conformity Rate"       value={`${conformity}%`} color="success" loading={loading} />
        <KPICard icon="🚨" label="Recalls Triggered"     value={recalled}    color="purple"  loading={loading} />
      </div>
    </div>
  );
}
