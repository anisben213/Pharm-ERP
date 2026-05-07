import { useEffect, useState } from 'react';
import { Hourglass, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import KPICard from '../../components/common/KPICard.jsx';
import { qualityControlService } from '../../services/index.js';

export default function QualityDashboard() {
  const [data, setData] = useState({ pending: 0, validated: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pending, history] = await Promise.all([
          qualityControlService.pending(),
          qualityControlService.history(),
        ]);
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        const isThisMonth = (d) => {
          const x = new Date(d);
          return x.getMonth() === month && x.getFullYear() === year;
        };
        setData({
          pending: pending.length,
          validated: history.filter((h) => h.result === 'VALIDATED' && isThisMonth(h.createdAt)).length,
          rejected: history.filter((h) => h.result === 'REJECTED' && isThisMonth(h.createdAt)).length,
          total: history.length,
        });
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard icon={<Hourglass size={20} />} label="Pending Analysis" value={data.pending} color="warning" loading={loading} />
      <KPICard icon={<CheckCircle2 size={20} />} label="Validated This Month" value={data.validated} color="success" loading={loading} />
      <KPICard icon={<XCircle size={20} />} label="Rejected This Month" value={data.rejected} color="danger" loading={loading} />
      <KPICard icon={<ShieldCheck size={20} />} label="Total Controls" value={data.total} color="primary" loading={loading} />
    </div>
  );
}
