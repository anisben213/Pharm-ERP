import { useEffect, useState } from 'react';
import { Send, Truck, PackageCheck, AlertTriangle } from 'lucide-react';
import KPICard from '../../components/common/KPICard.jsx';
import { purchaseOrderService, stockService } from '../../services/index.js';

export default function PurchaseDashboard() {
  const [data, setData] = useState({ sent: 0, inProgress: 0, received: 0, low: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [orders, alerts] = await Promise.all([purchaseOrderService.list(), stockService.alerts()]);
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        setData({
          sent: orders.filter((o) => o.status === 'SENT').length,
          inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
          received: orders.filter((o) => o.status === 'RECEIVED' &&
            o.updatedAt && new Date(o.updatedAt).getMonth() === month &&
            new Date(o.updatedAt).getFullYear() === year).length,
          low: (alerts.lowStock || []).filter((p) => p.category === 'RAW_MATERIAL').length,
        });
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard icon={<Send size={20} />} label="Orders Sent" value={data.sent} color="primary" loading={loading} />
      <KPICard icon={<Truck size={20} />} label="In Progress" value={data.inProgress} color="warning" loading={loading} />
      <KPICard icon={<PackageCheck size={20} />} label="Received This Month" value={data.received} color="success" loading={loading} />
      <KPICard icon={<AlertTriangle size={20} />} label="Low Stock (RM)" value={data.low} color="danger" loading={loading} />
    </div>
  );
}
