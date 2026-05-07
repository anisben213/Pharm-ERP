import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, Truck, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import KPICard from '../../components/common/KPICard.jsx';
import { salesOrderService, deliveryNoteService, clientService } from '../../services/index.js';

const STATUS_COLORS = {
  'Pending':   '#f59e0b',
  'Confirmed': '#1d4ed8',
  'Delivered': '#10b981',
  'Cancelled': '#ef4444',
};
const PIE_COLORS = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const fmtDZD = (v) => `${Math.round(Number(v || 0)).toLocaleString()} DZD`;

function thisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function SalesDashboard() {
  const [kpis, setKpis] = useState({ orders: 0, revenue: 0, pending: 0, clients: 0 });
  const [statusChart, setStatusChart] = useState([]);
  const [productChart, setProductChart] = useState([]);
  const [clientChart, setClientChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [orders, deliveries, clients] = await Promise.all([
          salesOrderService.list(),
          deliveryNoteService.list(),
          clientService.list(),
        ]);

        const monthOrders = orders.filter((o) => thisMonth(o.createdAt));
        // Revenue = total of CONFIRMED + DELIVERED orders this month (i.e. realized sales)
        const revenue = monthOrders
          .filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
          .reduce((s, o) => s + Number(o.totalAmount || 0), 0);

        setKpis({
          orders: monthOrders.length,
          revenue,
          pending: deliveries.filter((d) => d.status === 'PREPARED' || d.status === 'SHIPPED').length,
          clients: clients.length,
        });

        // Orders by status (all-time)
        setStatusChart([
          { name: 'Pending',   count: orders.filter((o) => o.status === 'PENDING').length },
          { name: 'Confirmed', count: orders.filter((o) => o.status === 'CONFIRMED').length },
          { name: 'Delivered', count: orders.filter((o) => o.status === 'DELIVERED').length },
          { name: 'Cancelled', count: orders.filter((o) => o.status === 'CANCELLED').length },
        ]);

        // Top 5 products sold this month (by revenue) — sum item.quantity * (totalAmount / order qty share)
        // Use product.unitPrice if present on item.product; fallback to splitting totalAmount proportionally.
        const productRevenue = {};
        monthOrders
          .filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
          .forEach((o) => {
            const items = o.items || [];
            const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0) || 1;
            items.forEach((it) => {
              const name = it.product?.name || `#${it.productId}`;
              // Revenue share for this item = order.totalAmount * (item.qty / totalQty)
              const share = Number(o.totalAmount || 0) * (Number(it.quantity || 0) / totalQty);
              productRevenue[name] = (productRevenue[name] || 0) + share;
            });
          });
        setProductChart(
          Object.entries(productRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value], i) => ({ name, value: Math.round(value), fill: PIE_COLORS[i % PIE_COLORS.length] }))
        );

        // Top 5 clients this month (by revenue)
        const clientRevenue = {};
        monthOrders
          .filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
          .forEach((o) => {
            const name = o.client?.name || `#${o.clientId}`;
            clientRevenue[name] = (clientRevenue[name] || 0) + Number(o.totalAmount || 0);
          });
        setClientChart(
          Object.entries(clientRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value], i) => ({ name, value: Math.round(value), fill: PIE_COLORS[i % PIE_COLORS.length] }))
        );

      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<ShoppingCart size={20} />} label="Orders This Month"   value={kpis.orders}            color="primary" loading={loading} />
        <KPICard icon={<DollarSign size={20} />}   label="Revenue This Month"  value={fmtDZD(kpis.revenue)}   color="success" loading={loading} />
        <KPICard icon={<Truck size={20} />}        label="Pending Deliveries"  value={kpis.pending}           color="warning" loading={loading} />
        <KPICard icon={<Users size={20} />}        label="Total Clients"       value={kpis.clients}           color="purple"  loading={loading} />
      </div>

      {/* ── Pie charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            Top Products Sold{' '}
            <span className="text-slate-400 font-normal text-xs">— this month, by revenue</span>
          </h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : productChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No sales this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={productChart} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {productChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [fmtDZD(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            Top Clients{' '}
            <span className="text-slate-400 font-normal text-xs">— this month, by revenue</span>
          </h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : clientChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No sales this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={clientChart} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {clientChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [fmtDZD(v), n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Orders by status bar ── */}
      <div className="card">
        <h3 className="text-base font-semibold text-ink-800 mb-4">Orders by Status</h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChart} barSize={48} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v) => [v, 'Orders']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusChart.map((d) => (
                  <Cell key={d.name} fill={STATUS_COLORS[d.name] || '#1d4ed8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
