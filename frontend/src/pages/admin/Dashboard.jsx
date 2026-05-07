import { useEffect, useState } from 'react';
import { Users, Package, UserCheck, Layers } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import KPICard from '../../components/common/KPICard.jsx';
import { userService, productService, salesOrderService, purchaseOrderService } from '../../services/index.js';

const ROLE_SHORT = {
  ADMIN: 'Admin',
  STOCK_MANAGER: 'Stock',
  PRODUCTION_MANAGER: 'Production',
  PURCHASE_MANAGER: 'Purchase',
  QUALITY_MANAGER: 'Quality',
  SALES_MANAGER: 'Sales',
};

const BAR_COLORS  = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const PIE_COLORS  = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
const PIE_COLORS2 = ['#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

function thisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function topN(map, n, colors) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
}

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

export default function AdminDashboard() {
  const [stats, setStats]       = useState({ users: 0, active: 0, products: 0, batches: 0 });
  const [roleChart, setRoleChart] = useState([]);
  const [soldChart, setSoldChart] = useState([]);
  const [boughtChart, setBoughtChart] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [users, products, salesOrders, purchaseOrders] = await Promise.all([
          userService.list(),
          productService.list(),
          salesOrderService.list(),
          purchaseOrderService.list(),
        ]);

        setStats({
          users: users.length,
          active: users.filter((u) => u.isActive).length,
          products: products.length,
          batches: 0,
        });

        // Role distribution
        const roleCounts = {};
        users.forEach((u) => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
        setRoleChart(Object.entries(roleCounts).map(([role, count]) => ({ name: ROLE_SHORT[role] ?? role, count })));

        // Top 5 most sold products this month (from sales order items)
        const soldMap = {};
        salesOrders
          .filter((o) => thisMonth(o.createdAt))
          .forEach((o) => {
            (o.items || []).forEach((it) => {
              const name = it.product?.name ?? `#${it.productId}`;
              soldMap[name] = (soldMap[name] || 0) + (it.quantity || 0);
            });
          });
        setSoldChart(topN(soldMap, 5, PIE_COLORS));

        // Top 5 most bought RMs this month (from purchase orders, 1 product each)
        const boughtMap = {};
        purchaseOrders
          .filter((o) => thisMonth(o.createdAt))
          .forEach((o) => {
            const name = o.product?.name ?? `#${o.productId}`;
            boughtMap[name] = (boughtMap[name] || 0) + (o.quantity || 0);
          });
        setBoughtChart(topN(boughtMap, 5, PIE_COLORS2));

      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Users size={20} />} label="Total Users" value={stats.users} loading={loading} />
        <KPICard icon={<UserCheck size={20} />} label="Active Users" value={stats.active} color="success" loading={loading} />
        <KPICard icon={<Package size={20} />} label="Total Products" value={stats.products} color="primary" loading={loading} />
        <KPICard icon={<Layers size={20} />} label="Total Batches" value={stats.batches} color="purple" loading={loading} />
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">Top Products Sold <span className="text-slate-400 font-normal text-xs">— this month</span></h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : soldChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No sales this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={soldChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderLabel}>
                  {soldChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v, n) => [v + ' units', n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">Top Raw Materials Bought <span className="text-slate-400 font-normal text-xs">— this month</span></h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : boughtChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No purchases this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={boughtChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderLabel}>
                  {boughtChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v, n) => [v + ' units', n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Users by role bar */}
      <div className="card">
        <h3 className="text-base font-semibold text-ink-800 mb-4">Users by Role</h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roleChart} barSize={36} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v) => [v, 'Users']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {roleChart.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
