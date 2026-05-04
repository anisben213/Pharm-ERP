import { useMemo } from 'react';
import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { ShoppingBag, TrendingUp, Truck, RotateCcw, CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';
import { salesService, customerService } from '../../services/index.js';
import { Link } from 'react-router-dom';

function orderTotal(o) {
  return (o.lines || []).reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0);
}

export default function SalesDashboard() {
  const { data, loading }           = useFetch(() => salesService.list().then((r) => r.orders), []);
  const { data: customers, loading: lc } = useFetch(() => customerService.list().then((r) => r.customers).catch(() => []), []);

  const all = data || [];
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth   = all.filter((o) => new Date(o.createdAt || 0) >= monthStart);
  const revenue     = thisMonth.reduce((acc, o) => acc + orderTotal(o), 0);
  const confirmed   = all.filter((o) => o.status === 'CONFIRMED');
  const delivered   = all.filter((o) => o.status === 'DELIVERED');
  const returned    = thisMonth.filter((o) => o.status === 'RETURNED');

  // Top 5 clients by revenue
  const topClients = useMemo(() => {
    const map = {};
    all.forEach((o) => {
      const name = o.customer?.name || '—';
      map[name] = (map[name] || 0) + orderTotal(o);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));
  }, [all]);

  const maxClientRevenue = topClients[0]?.total || 1;

  // Pending delivery: need action
  const pendingDelivery = confirmed.slice(0, 5);

  const statusGroups = [
    { label: 'Confirmed',  status: 'CONFIRMED',  color: 'bg-warning-400' },
    { label: 'Delivered',  status: 'DELIVERED',  color: 'bg-success-500' },
    { label: 'Returned',   status: 'RETURNED',   color: 'bg-danger-400' },
    { label: 'Cancelled',  status: 'CANCELLED',  color: 'bg-slate-300' },
  ].map((g) => ({ ...g, count: all.filter((o) => o.status === g.status).length }));

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Dashboard" subtitle="Pipeline, revenue and post-sale activity." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={<ShoppingBag size={22} />} label="Orders MTD"       value={thisMonth.length} color="primary" loading={loading} />
        <KPICard icon={<TrendingUp size={22} />}  label="Revenue MTD"      value={revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} color="success" loading={loading} />
        <KPICard icon={<Clock size={22} />}       label="Pending Delivery" value={confirmed.length} color="warning" loading={loading} />
        <KPICard icon={<CheckCircle size={22} />} label="Delivered"        value={delivered.length} color="success" loading={loading} />
        <KPICard icon={<RotateCcw size={22} />}   label="Returns MTD"      value={returned.length}  color="danger"  loading={loading} />
        <KPICard icon={<Users size={22} />}       label="Clients"          value={(customers || []).length} color="slate" loading={lc} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Orders */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">Recent Orders</h3>
            <Link to="/sales_manager/orders" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {loading ? <Skeleton lines={5} /> : all.length === 0
            ? <p className="text-sm text-slate-400 py-4 text-center">No orders yet.</p>
            : (
              <div className="divide-y divide-slate-100">
                {all.slice(0, 8).map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium font-mono">{o.reference || o.id}</p>
                      <p className="text-xs text-slate-500">{o.customer?.name || '—'} · {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">{orderTotal(o).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <Badge status={o.status} label={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Order Status Breakdown */}
          <div className="card">
            <h3 className="font-semibold text-ink-800 mb-4">Order Status</h3>
            {loading ? <Skeleton lines={4} /> : (
              <div className="space-y-3">
                {statusGroups.map(({ label, count, color }) => {
                  const pct = all.length ? Math.round((count / all.length) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-semibold tabular-nums">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-slate-400 pt-1">{all.length} total orders</p>
              </div>
            )}
          </div>

          {/* Top Clients */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-800">Top Clients</h3>
              <Link to="/sales_manager/clients" className="text-xs text-primary hover:underline">Manage →</Link>
            </div>
            {loading ? <Skeleton lines={4} /> : topClients.length === 0
              ? <p className="text-sm text-slate-400">No data yet.</p>
              : (
                <div className="space-y-3">
                  {topClients.map(({ name, total }) => (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate text-slate-700 max-w-[140px]">{name}</span>
                        <span className="font-semibold tabular-nums text-ink-800">{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((total / maxClientRevenue) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Pending Deliveries action list */}
      {pendingDelivery.length > 0 && (
        <div className="card border-l-4 border-warning">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-warning-600" />
            <h3 className="font-semibold text-ink-800">Orders Awaiting Delivery ({confirmed.length})</h3>
            <Link to="/sales_manager/deliveries" className="ml-auto text-xs text-primary hover:underline">Go to Deliveries →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingDelivery.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-sm text-primary">{o.reference || o.id}</span>
                <span className="text-sm text-slate-600">{o.customer?.name || '—'}</span>
                <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                <Link to={`/sales_manager/orders/${o.id}`} className="text-xs text-primary hover:underline">View →</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
