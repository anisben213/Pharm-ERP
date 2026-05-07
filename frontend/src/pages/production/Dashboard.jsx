import { useEffect, useState } from 'react';
import { Factory, Hourglass, CheckCircle2, AlertTriangle } from 'lucide-react';
import KPICard from '../../components/common/KPICard.jsx';
import { manufacturingOrderService, stockService } from '../../services/index.js';

export default function ProductionDashboard() {
  const [data, setData] = useState({ inProgress: 0, pendingQc: 0, closed: 0, low: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [orders, alerts] = await Promise.all([manufacturingOrderService.list(), stockService.alerts()]);
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        setData({
          inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
          pendingQc: orders.filter((o) => o.status === 'PENDING_QC').length,
          closed: orders.filter((o) => o.status === 'CLOSED' &&
            o.updatedAt && new Date(o.updatedAt).getMonth() === month &&
            new Date(o.updatedAt).getFullYear() === year).length,
          low: (alerts.lowStock || []).filter((p) => p.category === 'FINISHED_PRODUCT').length,
        });
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard icon={<Factory size={20} />} label="Orders In Progress" value={data.inProgress} color="primary" loading={loading} />
      <KPICard icon={<Hourglass size={20} />} label="Pending QC" value={data.pendingQc} color="warning" loading={loading} />
      <KPICard icon={<CheckCircle2 size={20} />} label="Closed This Month" value={data.closed} color="success" loading={loading} />
      <KPICard icon={<AlertTriangle size={20} />} label="Low Stock (FP)" value={data.low} color="danger" loading={loading} />
    </div>
  );
}
