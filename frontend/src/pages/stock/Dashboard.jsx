import { useEffect, useState } from 'react';
import { Boxes, AlertTriangle, Clock, Lock } from 'lucide-react';
import KPICard from '../../components/common/KPICard.jsx';
import { stockService } from '../../services/index.js';

export default function StockDashboard() {
  const [data, setData] = useState({ validated: 0, blocked: 0, low: 0, expiring: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [stock, alerts] = await Promise.all([stockService.list(), stockService.alerts()]);
        setData({
          validated: (stock.finished?.length || 0) + (stock.raw?.length || 0),
          blocked: stock.blocked?.length || 0,
          low: alerts.lowStock?.length || 0,
          expiring: alerts.expiring?.length || 0,
        });
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Boxes size={20} />} label="Validated Batches in Stock" value={data.validated} color="success" loading={loading} />
        <KPICard icon={<AlertTriangle size={20} />} label="Low Stock Alerts" value={data.low} color="danger" loading={loading} />
        <KPICard icon={<Clock size={20} />} label="Expiring Within 30 Days" value={data.expiring} color="warning" loading={loading} />
        <KPICard icon={<Lock size={20} />} label="Blocked Batches" value={data.blocked} color="gray" loading={loading} />
      </div>
    </div>
  );
}
