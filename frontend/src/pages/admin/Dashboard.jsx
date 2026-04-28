import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import {
  productService, productionService, qualityService, purchaseService,
  salesService, userService, stockService, logsService,
} from '../../services/index.js';

export default function AdminDashboard() {
  const { data: products } = useFetch(() => productService.list().then((r) => r.products), []);
  const { data: orders } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const { data: purchases } = useFetch(() => purchaseService.list().then((r) => r.orders), []);
  const { data: sales } = useFetch(() => salesService.list().then((r) => r.orders), []);
  const { data: users } = useFetch(() => userService.list().then((r) => r.users), []);
  const { data: expiring } = useFetch(() => stockService.expiring(90).then((r) => r.batches), []);
  const { data: logs, loading: logsLoading } = useFetch(() => logsService.list({ limit: 10 }).then((r) => r.logs).catch(() => []), []);

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const revenue = (sales || []).filter((s) => new Date(s.createdAt || 0) >= monthStart).reduce((a, s) => a + Number(s.totalAmount ?? 0), 0);

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Cross-module KPIs and recent activity." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="👥" label="Users"               value={(users || []).length}     color="primary" loading={!users} />
        <KPICard icon="💊" label="Products"            value={(products || []).length}  color="gray"    loading={!products} />
        <KPICard icon="🏭" label="Production Orders"   value={(orders || []).length}    color="purple"  loading={!orders} />
        <KPICard icon="💰" label="Sales (MTD)"         value={revenue.toLocaleString(undefined,{minimumFractionDigits:2})} color="success" loading={!sales} />
        <KPICard icon="📦" label="Purchase Orders"     value={(purchases || []).length} color="primary" loading={!purchases} />
        <KPICard icon="⚠️" label="Expiring (≤90 d)"    value={(expiring || []).length}  color="warning" loading={!expiring} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="card">
          <h3 className="font-semibold mb-3">Activity (last 30 days)</h3>
          <ActivityChart sales={sales || []} purchases={purchases || []} production={orders || []} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Activity</h3>
            <a href="/admin/logs" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          {logsLoading
            ? <Skeleton lines={5} />
            : (logs || []).length === 0
              ? <EmptyState icon="📜" title="No logs" message="Activity will appear here." />
              : (
                <ul className="text-sm divide-y divide-slate-100">
                  {(logs || []).slice(0, 10).map((l) => (
                    <li key={l.id} className="py-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-ink-800">{l.action || l.message}</div>
                        <div className="text-xs text-slate-500">{l.user?.email || l.userEmail || 'system'}</div>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(l.createdAt || l.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
        </div>
      </div>
    </div>
  );
}

function ActivityChart({ sales, purchases, production }) {
  // Simple inline bar chart (last 7 days) — avoids extra deps
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0); return d;
  });
  const count = (arr, day) => arr.filter((x) => {
    const t = new Date(x.createdAt || 0); t.setHours(0, 0, 0, 0); return t.getTime() === day.getTime();
  }).length;
  const rows = days.map((d) => ({
    label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    sales: count(sales, d), purchases: count(purchases, d), production: count(production, d),
  }));
  const max = Math.max(1, ...rows.flatMap((r) => [r.sales, r.purchases, r.production]));

  return (
    <div>
      <div className="flex items-end gap-3 h-40">
        {rows.map((r) => (
          <div key={r.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-32 w-full justify-center">
              <div className="w-2 bg-primary rounded-t" style={{ height: `${(r.sales / max) * 100}%` }} title={`Sales: ${r.sales}`} />
              <div className="w-2 bg-success rounded-t" style={{ height: `${(r.purchases / max) * 100}%` }} title={`Purchases: ${r.purchases}`} />
              <div className="w-2 bg-warning rounded-t" style={{ height: `${(r.production / max) * 100}%` }} title={`Production: ${r.production}`} />
            </div>
            <span className="text-xs text-slate-500">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-primary rounded-sm" /> Sales</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-success rounded-sm" /> Purchases</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-warning rounded-sm" /> Production</span>
      </div>
    </div>
  );
}
