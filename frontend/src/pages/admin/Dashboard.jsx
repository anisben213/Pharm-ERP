import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Users, Pill, Factory, ShoppingCart, AlertTriangle, ScrollText, CheckCircle, XCircle, TrendingUp, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const { data: stockSummary } = useFetch(() => stockService.summary().then((r) => r.summary), []);
  const { data: expiring } = useFetch(() => stockService.expiring(30).then((r) => r.batches), []);
  const { data: logs, loading: logsLoading } = useFetch(() => logsService.list({ limit: 8 }).then((r) => r.logs).catch(() => []), []);
  const { data: qualityChecks } = useFetch(() => qualityService.list().then((r) => r.checks).catch(() => []), []);

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const salesThisMonth = (sales || []).filter((s) => new Date(s.createdAt || 0) >= monthStart);
  const revenue = salesThisMonth.reduce((a, s) => a + Number(s.totalAmount ?? 0), 0);

  const activeUsers = (users || []).filter((u) => u.isActive).length;
  const inProgressOrders = (orders || []).filter((o) => o.status === 'IN_PROGRESS').length;
  const pendingPurchases = (purchases || []).filter((p) => p.status === 'DRAFT' || p.status === 'CONFIRMED').length;
  const lowStockCount = (stockSummary || []).filter((s) => { const q = Number(s.quantity ?? 0); return q > 0 && q <= Number(s.minLevel ?? 0); }).length;
  const outOfStockCount = (stockSummary || []).filter((s) => Number(s.quantity ?? 0) <= 0).length;
  const passedQC = (qualityChecks || []).filter((c) => c.result === 'PASSED').length;
  const failedQC = (qualityChecks || []).filter((c) => c.result === 'FAILED').length;

  const usersByRole = (users || []).reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const roleLabels = {
    ADMIN: 'Admin', PURCHASER: 'Purchase', STOCK_MANAGER: 'Stock',
    WAREHOUSE_KEEPER: 'Warehouse', PRODUCTION_MANAGER: 'Production',
    QUALITY_CONTROLLER: 'Quality', LAB_TECHNICIAN: 'Lab', SALES_AGENT: 'Sales',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System-wide overview — users, stock, production and quality." />

      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard icon={<Users size={20} />}         label="Active Users"        value={activeUsers}         color="primary"  loading={!users} />
        <KPICard icon={<Pill size={20} />}          label="Products"            value={(products || []).length} color="gray"  loading={!products} />
        <KPICard icon={<Factory size={20} />}       label="In Production"       value={inProgressOrders}    color="purple"   loading={!orders} />
        <KPICard icon={<ShoppingCart size={20} />}  label="Pending Purchases"   value={pendingPurchases}    color="primary"  loading={!purchases} />
        <KPICard icon={<AlertTriangle size={20} />} label="Low / Out of Stock"  value={`${lowStockCount} / ${outOfStockCount}`} color="danger" loading={!stockSummary} />
        <KPICard icon={<TrendingUp size={20} />}    label="Sales (MTD)"         value={salesThisMonth.length} color="success" loading={!sales} />
      </div>

      {/* Row 2: detailed panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-4">Activity — last 7 days</h3>
          <ActivityChart sales={sales || []} purchases={purchases || []} production={orders || []} />
        </div>

        {/* QC summary */}
        <div className="card">
          <h3 className="font-semibold mb-4">Quality Control</h3>
          {!qualityChecks ? <Skeleton lines={3} /> : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-success-600" /> Passed</span>
                <span className="font-semibold text-success-600">{passedQC}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><XCircle size={16} className="text-danger" /> Failed</span>
                <span className="font-semibold text-danger">{failedQC}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><AlertTriangle size={16} className="text-warning-600" /> Pending</span>
                <span className="font-semibold text-warning-600">{(qualityChecks || []).filter((c) => c.result === 'PENDING').length}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total checks</span>
                  <span className="font-semibold">{(qualityChecks || []).length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: stock alerts + users by role + recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Critical stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Critical Stock</h3>
            <Link to="/admin/stock" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {!stockSummary ? <Skeleton lines={4} /> : (
            (() => {
              const critical = (stockSummary || [])
                .filter((s) => Number(s.quantity ?? 0) <= Number(s.minLevel ?? 0))
                .sort((a, b) => Number(a.quantity) - Number(b.quantity))
                .slice(0, 6);
              return critical.length === 0
                ? <EmptyState icon={<Package size={32} />} title="Stock OK" message="All products above minimum level." />
                : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {critical.map((s, i) => (
                      <li key={i} className="py-2 flex items-center justify-between gap-2">
                        <span className="truncate">{s.productName}</span>
                        <span className={`font-mono font-semibold ${Number(s.quantity) <= 0 ? 'text-danger' : 'text-warning-600'}`}>
                          {s.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
            })()
          )}
          {(expiring || []).length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-medium text-slate-500 mb-2">Expiring ≤ 30 days</p>
              <ul className="text-xs divide-y divide-slate-100">
                {(expiring || []).slice(0, 3).map((b) => (
                  <li key={b.id} className="py-1.5 flex justify-between">
                    <span className="font-mono text-primary">{b.batchNumber}</span>
                    <span className="text-warning-600">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Users by role */}
        <div className="card">
          <h3 className="font-semibold mb-3">Users by Role</h3>
          {!users ? <Skeleton lines={5} /> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {Object.entries(usersByRole).map(([role, count]) => (
                <li key={role} className="py-2 flex items-center justify-between">
                  <span className="text-slate-600">{roleLabels[role] || role}</span>
                  <span className="font-semibold text-ink-800">{count}</span>
                </li>
              ))}
              {Object.keys(usersByRole).length === 0 && (
                <li className="py-2 text-slate-400 text-center">No users</li>
              )}
            </ul>
          )}
        </div>

        {/* Recent activity log */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Activity</h3>
            <a href="/admin/logs" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          {logsLoading
            ? <Skeleton lines={5} />
            : (logs || []).length === 0
              ? <EmptyState icon={<ScrollText size={32} />} title="No logs" message="Activity will appear here." />
              : (
                <ul className="text-xs divide-y divide-slate-100">
                  {(logs || []).slice(0, 8).map((l) => (
                    <li key={l.id} className="py-2 space-y-0.5">
                      <div className="text-ink-800 font-medium truncate">{l.action || l.message}</div>
                      <div className="flex justify-between text-slate-400">
                        <span>{l.user?.email || l.userEmail || 'system'}</span>
                        <span>{new Date(l.createdAt || l.timestamp).toLocaleString()}</span>
                      </div>
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
              <div className="w-2.5 bg-primary rounded-t transition-all" style={{ height: `${(r.sales / max) * 100}%`, minHeight: r.sales > 0 ? 4 : 0 }} title={`Sales: ${r.sales}`} />
              <div className="w-2.5 bg-success rounded-t transition-all" style={{ height: `${(r.purchases / max) * 100}%`, minHeight: r.purchases > 0 ? 4 : 0 }} title={`Purchases: ${r.purchases}`} />
              <div className="w-2.5 bg-warning rounded-t transition-all" style={{ height: `${(r.production / max) * 100}%`, minHeight: r.production > 0 ? 4 : 0 }} title={`Production: ${r.production}`} />
            </div>
            <span className="text-xs text-slate-500">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-5 mt-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary rounded-sm inline-block" /> Sales</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-success rounded-sm inline-block" /> Purchases</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-warning rounded-sm inline-block" /> Production</span>
      </div>
    </div>
  );
}
