import { useMemo } from 'react';
import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { FileText, Package, CheckCircle, Building2, AlertTriangle, Star } from 'lucide-react';
import { purchaseService, supplierService } from '../../services/index.js';
import { Link } from 'react-router-dom';

export default function PurchaseDashboard() {
  const { data: orders,   loading: lo } = useFetch(() => purchaseService.list().then((r) => r.orders), []);
  const { data: suppliers, loading: ls } = useFetch(() => supplierService.list().then((r) => r.suppliers).catch(() => []), []);

  const all = orders || [];
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const draft      = all.filter((o) => o.status === 'DRAFT');
  const sent       = all.filter((o) => o.status === 'SENT');
  const inTransit  = all.filter((o) => ['SENT', 'CONFIRMED'].includes(o.status));
  const received   = all.filter((o) => o.status === 'RECEIVED');
  const receivedMTD = received.filter((o) => new Date(o.receivedAt || o.updatedAt || 0) >= monthStart);

  // Total spend MTD
  const spendMTD = receivedMTD.reduce((s, o) =>
    s + (o.lines || []).reduce((ls2, l) => ls2 + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0), 0
  );

  // Orders by status for breakdown
  const statusGroups = [
    { label: 'Draft',     status: 'DRAFT',     color: 'bg-slate-300' },
    { label: 'Sent',      status: 'SENT',      color: 'bg-primary-400' },
    { label: 'Confirmed', status: 'CONFIRMED', color: 'bg-warning-400' },
    { label: 'Received',  status: 'RECEIVED',  color: 'bg-success-500' },
  ].map((g) => ({ ...g, count: all.filter((o) => o.status === g.status).length }));

  // Top suppliers by order count
  const topSuppliers = useMemo(() => {
    const map = {};
    all.forEach((o) => {
      const name = o.supplier?.name || o.supplierName || '—';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [all]);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Dashboard" subtitle="Procurement pipeline & supplier overview." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={<FileText size={22} />}    label="Draft Requests"    value={draft.length}          color="warning" loading={lo} />
        <KPICard icon={<Package size={22} />}     label="In Transit"        value={inTransit.length}      color="primary" loading={lo} />
        <KPICard icon={<CheckCircle size={22} />} label="Received MTD"      value={receivedMTD.length}    color="success" loading={lo} />
        <KPICard icon={<Building2 size={22} />}   label="Suppliers"         value={(suppliers || []).length} color="slate" loading={ls} />
        <KPICard icon={<AlertTriangle size={22} />} label="Total Orders"    value={all.length}            color="slate"   loading={lo} />
        <KPICard icon={<Star size={22} />}        label="Spend MTD"         value={spendMTD.toLocaleString(undefined, { maximumFractionDigits: 0 })} color="success" loading={lo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent POs */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">Recent Purchase Orders</h3>
            <Link to="/purchase_manager/orders" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {lo ? <Skeleton lines={5} /> : all.length === 0
            ? <p className="text-sm text-slate-400 py-4 text-center">No orders yet.</p>
            : (
              <div className="divide-y divide-slate-100">
                {all.slice(0, 8).map((o) => {
                  const total = (o.lines || []).reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0);
                  return (
                    <div key={o.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium font-mono">{o.orderNumber || o.reference || o.id}</p>
                        <p className="text-xs text-slate-500">{o.supplier?.name || o.supplierName || '—'} · {new Date(o.createdAt || o.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {total > 0 && <span className="text-sm font-semibold tabular-nums">{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>}
                        <Badge status={o.status} label={o.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Status breakdown */}
          <div className="card">
            <h3 className="font-semibold text-ink-800 mb-4">Order Status</h3>
            {lo ? <Skeleton lines={4} /> : (
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

          {/* Top suppliers */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink-800">Top Suppliers</h3>
              <Link to="/purchase_manager/suppliers" className="text-xs text-primary hover:underline">Manage →</Link>
            </div>
            {lo ? <Skeleton lines={4} /> : topSuppliers.length === 0
              ? <p className="text-sm text-slate-400">No data yet.</p>
              : (
                <div className="space-y-2">
                  {topSuppliers.map(({ name, count }) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="truncate text-slate-700 max-w-[160px]">{name}</span>
                      <span className="font-semibold tabular-nums text-ink-800 ml-2">{count} order{count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Action: pending orders waiting to be sent */}
      {sent.length > 0 && (
        <div className="card border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-primary-600" />
            <h3 className="font-semibold text-ink-800">Orders Sent — Awaiting Receipt ({sent.length})</h3>
            <Link to="/purchase_manager/tracking" className="ml-auto text-xs text-primary hover:underline">Track deliveries →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {sent.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-sm text-primary">{o.orderNumber || o.reference || o.id}</span>
                <span className="text-sm text-slate-600">{o.supplier?.name || '—'}</span>
                <span className="text-xs text-slate-500">{new Date(o.createdAt || o.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

