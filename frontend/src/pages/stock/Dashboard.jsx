import { useEffect, useState } from 'react';
import { Boxes, AlertTriangle, Clock, Truck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import KPICard from '../../components/common/KPICard.jsx';
import { stockService, deliveryNoteService } from '../../services/index.js';

const PIE_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444'];

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

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
}

function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function StockDashboard() {
  const [stock, setStock] = useState({ finished: [], raw: [], blocked: [] });
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
  const [movements, setMovements] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, m, d] = await Promise.all([
          stockService.list(),
          stockService.alerts(),
          stockService.movements(),
          deliveryNoteService.list(),
        ]);
        setStock(s);
        setAlerts(a);
        setMovements(m);
        setDeliveries(d);
      } finally { setLoading(false); }
    })();
  }, []);

  // ── KPIs ──
  const validated = (stock.finished?.length || 0) + (stock.raw?.length || 0);
  const blocked   = stock.blocked?.length || 0;
  const pendingDN = deliveries.filter((d) => d.status === 'PREPARED' || d.status === 'SHIPPED').length;

  // ── Stock by category pie ──
  const allBatches = [...(stock.finished || []), ...(stock.raw || [])];
  const byProduct = {};
  for (const b of allBatches) {
    const name = b.product?.name || `#${b.productId}`;
    byProduct[name] = (byProduct[name] || 0) + Number(b.quantity || 0);
  }
  const productPie = Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value: Math.round(value), fill: PIE_COLORS[i % PIE_COLORS.length] }));

  // ── Movements last 7 days ──
  const days = last7Days();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recentMovements = movements.filter((m) => new Date(m.date) >= cutoff);

  const movementChart = days.map((label) => {
    const entry = recentMovements.filter((m) => m.type === 'ENTRY' && dayLabel(m.date) === label)
      .reduce((s, m) => s + Number(m.quantity || 0), 0);
    const exit  = recentMovements.filter((m) => m.type === 'EXIT'  && dayLabel(m.date) === label)
      .reduce((s, m) => s + Number(m.quantity || 0), 0);
    return { label, entry, exit };
  });

  // ── Category distribution pie ──
  const finishedQty = (stock.finished || []).reduce((s, b) => s + Number(b.quantity || 0), 0);
  const rawQty      = (stock.raw     || []).reduce((s, b) => s + Number(b.quantity || 0), 0);
  const categoryPie = [
    { name: 'Finished Products', value: Math.round(finishedQty), fill: '#10b981' },
    { name: 'Raw Materials',     value: Math.round(rawQty),      fill: '#0ea5e9' },
    ...(blocked > 0 ? [{ name: 'Blocked', value: blocked, fill: '#ef4444' }] : []),
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Boxes size={20} />}         label="Batches in Stock"      value={validated}               color="success" loading={loading} />
        <KPICard icon={<AlertTriangle size={20} />} label="Low Stock Alerts"      value={alerts.lowStock?.length || 0}  color="danger"  loading={loading} />
        <KPICard icon={<Clock size={20} />}         label="Expiring Within 30 d"  value={alerts.expiring?.length || 0}  color="warning" loading={loading} />
        <KPICard icon={<Truck size={20} />}         label="Pending Deliveries"    value={pendingDN}               color="primary" loading={loading} />
      </div>

      {/* ── Movements bar + category pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-4">
            Stock Movements{' '}
            <span className="text-slate-400 font-normal text-xs">— last 7 days</span>
          </h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={movementChart} barSize={16} barGap={4}
                margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="entry" name="Entry"  fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exit"  name="Exit"   fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            Stock by Category
          </h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : categoryPie.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No stock data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {categoryPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [`${v} units`, n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top products pie ── */}
      <div className="card">
        <h3 className="text-base font-semibold text-ink-800 mb-1">
          Top 5 Products in Stock{' '}
          <span className="text-slate-400 font-normal text-xs">— by quantity</span>
        </h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : productPie.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No stock data</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={productPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {productPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [`${v} units`, n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
