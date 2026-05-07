import { useEffect, useState } from 'react';
import { Send, Truck, PackageCheck, AlertTriangle, Building2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import KPICard from '../../components/common/KPICard.jsx';
import { purchaseOrderService, supplierService, stockService } from '../../services/index.js';

const STATUS_COLORS = {
  'Sent':       '#1d4ed8',
  'In Progress':'#f59e0b',
  'Received':   '#10b981',
};
const PIE_COLORS = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function thisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function PurchaseDashboard() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, s, a] = await Promise.all([
          purchaseOrderService.list(),
          supplierService.list(),
          stockService.alerts(),
        ]);
        setOrders(o);
        setSuppliers(s);
        setAlerts(a);
      } finally { setLoading(false); }
    })();
  }, []);

  // ── KPIs ──
  const sent       = orders.filter((o) => o.status === 'SENT').length;
  const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length;
  const received   = orders.filter((o) => thisMonth(o.updatedAt) && o.status === 'RECEIVED').length;
  const lowRM      = (alerts.lowStock || []).filter((p) => p.category === 'RAW_MATERIAL').length;

  // ── Orders by status ──
  const statusChart = [
    { name: 'Sent',        count: sent },
    { name: 'In Progress', count: inProgress },
    { name: 'Received',    count: orders.filter((o) => o.status === 'RECEIVED').length },
  ];

  // ── Orders per supplier pie (top 5) ──
  const bySupplier = {};
  for (const o of orders) {
    const name = o.supplier?.name || `#${o.supplierId}`;
    bySupplier[name] = (bySupplier[name] || 0) + 1;
  }
  const supplierPie = Object.entries(bySupplier)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  // ── Orders per product pie (top 5 by quantity) ──
  const byProduct = {};
  for (const o of orders) {
    const name = o.product?.name || `#${o.productId}`;
    byProduct[name] = (byProduct[name] || 0) + Number(o.quantity || 0);
  }
  const productPie = Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value: Math.round(value), fill: PIE_COLORS[i % PIE_COLORS.length] }));

  return (
    <div className="space-y-6">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={<Send size={20} />}          label="Orders Sent"          value={sent}                 color="primary" loading={loading} />
        <KPICard icon={<Truck size={20} />}          label="In Progress"          value={inProgress}           color="warning" loading={loading} />
        <KPICard icon={<PackageCheck size={20} />}   label="Received This Month"  value={received}             color="success" loading={loading} />
        <KPICard icon={<AlertTriangle size={20} />}  label="Low Stock (RM)"       value={lowRM}                color="danger"  loading={loading} />
        <KPICard icon={<Building2 size={20} />}      label="Total Suppliers"      value={suppliers.length}     color="purple"  loading={loading} />
      </div>

      {/* ── Status bar + Supplier pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-4">Orders by Status</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChart} barSize={52} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
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

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            Orders by Supplier
            <span className="text-slate-400 font-normal text-xs ml-2">— top 5</span>
          </h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : supplierPie.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={supplierPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {supplierPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [v + ' orders', n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Product quantity pie ── */}
      <div className="card">
        <h3 className="text-base font-semibold text-ink-800 mb-1">
          Top Products Ordered
          <span className="text-slate-400 font-normal text-xs ml-2">— by total quantity</span>
        </h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : productPie.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No orders yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={productPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={80} labelLine={false} label={renderLabel}>
                {productPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v, n) => [v + ' units', n]} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
