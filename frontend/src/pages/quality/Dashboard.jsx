import { useEffect, useState } from 'react';
import { Hourglass, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import KPICard from '../../components/common/KPICard.jsx';
import { qualityControlService } from '../../services/index.js';

const PIE_COLORS = ['#10b981', '#ef4444', '#0ea5e9', '#f59e0b', '#8b5cf6'];

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

function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), month: d.getMonth(), year: d.getFullYear() };
  });
}

function thisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function QualityDashboard() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, h] = await Promise.all([
          qualityControlService.pending(),
          qualityControlService.history(),
        ]);
        setPending(p);
        setHistory(h);
      } finally { setLoading(false); }
    })();
  }, []);

  // ── KPIs ──
  const validated  = history.filter((h) => h.result === 'VALIDATED' && thisMonth(h.controlDate)).length;
  const rejected   = history.filter((h) => h.result === 'REJECTED'  && thisMonth(h.controlDate)).length;

  // ── Monthly trend bar (last 6 months) ──
  const months = last6Months();
  const trendChart = months.map(({ label, month, year }) => ({
    label,
    validated: history.filter((h) => {
      const d = new Date(h.controlDate);
      return h.result === 'VALIDATED' && d.getMonth() === month && d.getFullYear() === year;
    }).length,
    rejected: history.filter((h) => {
      const d = new Date(h.controlDate);
      return h.result === 'REJECTED' && d.getMonth() === month && d.getFullYear() === year;
    }).length,
  }));

  // ── Result distribution pie ──
  const totalV = history.filter((h) => h.result === 'VALIDATED').length;
  const totalR = history.filter((h) => h.result === 'REJECTED').length;
  const resultPie = [
    { name: 'Validated', value: totalV, fill: '#10b981' },
    { name: 'Rejected',  value: totalR, fill: '#ef4444' },
  ].filter((d) => d.value > 0);

  // ── Origin breakdown pie ──
  const byOrigin = {};
  for (const h of history) {
    byOrigin[h.origin] = (byOrigin[h.origin] || 0) + 1;
  }
  const originPie = Object.entries(byOrigin)
    .map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  // ── Top 5 products by controls ──
  const byProduct = {};
  for (const h of history) {
    const name = h.batch?.product?.name || `Batch #${h.batchId}`;
    byProduct[name] = (byProduct[name] || 0) + 1;
  }
  const productChart = Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Hourglass size={20} />}     label="Pending Analysis"      value={pending.length} color="warning" loading={loading} />
        <KPICard icon={<CheckCircle2 size={20} />}  label="Validated This Month"  value={validated}      color="success" loading={loading} />
        <KPICard icon={<XCircle size={20} />}       label="Rejected This Month"   value={rejected}       color="danger"  loading={loading} />
        <KPICard icon={<ShieldCheck size={20} />}   label="Total Controls"        value={history.length} color="primary" loading={loading} />
      </div>

      {/* ── Monthly trend + result pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-4">
            Controls Trend
            <span className="text-slate-400 font-normal text-xs ml-2">— last 6 months</span>
          </h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendChart} barSize={16} barGap={4}
                margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="validated" name="Validated" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected"  name="Rejected"  fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">Result Distribution</h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : resultPie.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No controls yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={resultPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {resultPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [v + ' controls', n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Origin pie + top products bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            Controls by Origin
          </h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : originPie.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No controls yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={originPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} labelLine={false} label={renderLabel}>
                  {originPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [v + ' controls', n]} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-ink-800 mb-4">
            Most Controlled Products
            <span className="text-slate-400 font-normal text-xs ml-2">— by count</span>
          </h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : productChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No controls yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productChart} layout="vertical" barSize={18}
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [v, 'Controls']}
                />
                <Bar dataKey="count" name="Controls" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
