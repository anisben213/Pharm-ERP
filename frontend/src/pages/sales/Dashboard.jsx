import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, Truck, Users } from 'lucide-react';
import KPICard from '../../components/common/KPICard.jsx';
import { salesOrderService, deliveryNoteService, clientService } from '../../services/index.js';

export default function SalesDashboard() {
  const [data, setData] = useState({ orders: 0, revenue: 0, pending: 0, clients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [orders, deliveries, clients] = await Promise.all([
          salesOrderService.list(),
          deliveryNoteService.list(),
          clientService.list(),
        ]);
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        const monthOrders = orders.filter((o) => {
          const d = new Date(o.createdAt);
          return d.getMonth() === month && d.getFullYear() === year;
        });
        const revenue = monthOrders.reduce((s, o) =>
          s + (o.items || []).reduce((ss, it) => ss + Number(it.unitPrice || 0) * Number(it.quantity || 0), 0), 0);
        setData({
          orders: monthOrders.length,
          revenue: revenue.toFixed(2),
          pending: deliveries.filter((d) => d.status !== 'DELIVERED').length,
          clients: clients.length,
        });
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard icon={<ShoppingCart size={20} />} label="Orders This Month" value={data.orders} color="primary" loading={loading} />
      <KPICard icon={<DollarSign size={20} />} label="Revenue This Month" value={`$${data.revenue}`} color="success" loading={loading} />
      <KPICard icon={<Truck size={20} />} label="Pending Deliveries" value={data.pending} color="warning" loading={loading} />
      <KPICard icon={<Users size={20} />} label="Total Clients" value={data.clients} color="purple" loading={loading} />
    </div>
  );
}
