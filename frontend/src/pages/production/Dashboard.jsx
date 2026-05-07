import { useEffect, useState } from 'react';
import { Factory, Hourglass, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import KPICard from '../../components/common/KPICard.jsx';
import { manufacturingOrderService, stockService } from '../../services/index.js';

const BAR_STATUS_COLORS = { 'In Progress': '#1d4ed8', 'Pending QC': '#f59e0b', 'Closed': '#10b981' };
const PROD_PIE_COLORS = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

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

function thisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// For closed orders, prefer updatedAt (set when closed); fall back to createdAt for older records.
const closedAt = (o) => o.updatedAt || o.createdAt;

export default function ProductionDashboard() {
  const [kpis, setKpis]           = useState({ inProgress: 0, pendingQc: 0, closed: 0, low: 0 });
  const [statusChart, setStatusChart] = useState([]);
  const [productChart, setProductChart] = useState([]);
  const [qcChart, setQcChart]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [orders, alerts] = await Promise.all([
          manufacturingOrderService.list(),
          stockService.alerts(),
        ]);

        setKpis({
          inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
          pendingQc:  orders.filter((o) => o.status === 'PENDING_QC').length,
          closed:     orders.filter((o) => o.status === 'CLOSED' && thisMonth(closedAt(o))).length,
          low:        (alerts.lowStock || []).filter((p) => p.category === 'FINISHED_PRODUCT').length,
        });

        // ── Orders by status bar chart ──
        setStatusChart([
          { name: 'In Progress', count: orders.filter((o) => o.status === 'IN_PROGRESS').length },
          { name: 'Pending QC',  count: orders.filter((o) => o.status === 'PENDING_QC').length  },
          { name: 'Closed',      count: orders.filter((o) => o.status === 'CLOSED').length      },
        ]);

        // ── Top 5 products produced this month (closed orders) ──
        const prodMap = {};
        orders
          .filter((o) => o.status === 'CLOSED' && thisMonth(closedAt(o)))
          .forEach((o) => {
            const name = o.product?.name || `#${o.productId}`;
            prodMap[name] = (prodMap[name] || 0) + (o.quantity || 0);
          });
        setProductChart(
          Object.entries(prodMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value], i) => ({ name, value, fill: PROD_PIE_COLORS[i % PROD_PIE_COLORS.length] }))
        );

        // ── QC results this month from embedded qualityControls on each MO's batch ──
        const qcThisMonth = orders.flatMap((o) =>
          (o.batch?.qualityControls || []).filter((q) => thisMonth(q.controlDate))
        );
        const validated = qcThisMonth.filter((q) => q.result === 'VALIDATED').length;
        const rejected  = qcThisMonth.filter((q) => q.result === 'REJECTED').length;
        setQcChart([
          { name: 'Validated', value: validated, fill: '#10b981' },
          { name: 'Rejected',  value: rejected,  fill: '#ef4444' },
        ].filter((d) => d.value > 0));

      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Factory size={20} />}      label="Orders In Progress"   value={kpis.inProgress} color="primary"  loading={loading} />
        <KPICard icon={<Hourglass size={20} />}    label="Pending QC"           value={kpis.pendingQc}  color="warning"  loading={loading} />
        <KPICard icon={<CheckCircle2 size={20} />} label="Closed This Month"    value={kpis.closed}     color="success"  loading={loading} />
        <KPICard icon={<AlertTriangle size={20} />} label="Low Stock (Finished)" value={kpis.low}        color="danger"   loading={loading} />
      </div>

      {/* ── Pie charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            Top Products Produced{' '}
            <span className="text-slate-400 font-normal text-xs">— this month</span>
          </h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : productChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No closed orders this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={productChart} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {productChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [`${v} units`, n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            QC Results{' '}
            <span className="text-slate-400 font-normal text-xs">— this month (production batches)</span>
          </h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : qcChart.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No QC records this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={qcChart} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {qcChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [`${v} controls`, n]} />
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
                  <Cell key={d.name} fill={BAR_STATUS_COLORS[d.name] || '#1d4ed8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
