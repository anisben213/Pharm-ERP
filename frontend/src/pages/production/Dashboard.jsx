import { useMemo } from 'react';
import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Factory, CheckCircle, Clock, XCircle, ListOrdered } from 'lucide-react';
import { productionService } from '../../services/index.js';
import { Link } from 'react-router-dom';

export default function ProductionDashboard() {
  const { data, loading } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const orders = data || [];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const inProgress    = orders.filter((o) => o.status === 'IN_PROGRESS');
  const planned       = orders.filter((o) => o.status === 'PLANNED');
  const completedAll  = orders.filter((o) => o.status === 'COMPLETED');
  const completedMTD  = completedAll.filter((o) => new Date(o.completedAt || o.updatedAt || 0) >= monthStart);
  const cancelled     = orders.filter((o) => o.status === 'CANCELLED');

  const total = orders.length || 1;
  const breakdown = [
    { label: 'Planned',     count: planned.length,      color: 'bg-warning-400' },
    { label: 'In Progress', count: inProgress.length,   color: 'bg-primary'     },
    { label: 'Completed',   count: completedAll.length, color: 'bg-success'     },
    { label: 'Cancelled',   count: cancelled.length,    color: 'bg-danger'      },
  ];

  const recentCompleted = useMemo(() =>
    [...completedAll]
      .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0) - new Date(a.completedAt || a.updatedAt || 0))
      .slice(0, 6),
    [completedAll]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Production Dashboard" subtitle="Track manufacturing orders and batch generation." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className={inProgress.length > 0 ? 'ring-2 ring-primary rounded-xl' : ''}>
          <KPICard icon={<Factory size={22} />}      label="In Progress"      value={inProgress.length}    color="primary" loading={loading} />
        </div>
        <KPICard icon={<Clock size={22} />}           label="Planned (Queue)"  value={planned.length}       color="warning" loading={loading} />
        <KPICard icon={<CheckCircle size={22} />}     label="Completed MTD"    value={completedMTD.length}  color="success" loading={loading} />
        <KPICard icon={<CheckCircle size={22} />}     label="Completed Total"  value={completedAll.length}  color="slate"   loading={loading} />
        <KPICard icon={<XCircle size={22} />}         label="Cancelled"        value={cancelled.length}     color="danger"  loading={loading} />
        <KPICard icon={<ListOrdered size={22} />}     label="Total Orders"     value={orders.length}        color="slate"   loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Orders */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">
              Active Orders
              {inProgress.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-primary text-white rounded-full">
                  {inProgress.length}
                </span>
              )}
            </h3>
            <Link to="/production_manager/manufacturing-orders" className="text-xs text-primary hover:underline">Manage orders →</Link>
          </div>
          {loading ? (
            <Skeleton lines={5} />
          ) : inProgress.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No orders currently in progress.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {inProgress.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{o.product?.name || o.productName || '—'}</p>
                    <p className="text-xs text-slate-500">
                      Ref: {o.reference} · Qty: {o.quantity}
                      {o.startedAt && ` · Started: ${new Date(o.startedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge status={o.status} />
                    {o.plannedDate && (
                      <p className="text-xs text-slate-400 mt-0.5">Due {new Date(o.plannedDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
              {inProgress.length > 8 && (
                <p className="text-xs text-slate-400 pt-2">+{inProgress.length - 8} more</p>
              )}
            </div>
          )}
        </div>

        {/* Right: status breakdown + planned backlog */}
        <div className="space-y-5">
          <div className="card">
            <h3 className="font-semibold text-ink-800 mb-4">Order Status</h3>
            {loading ? <Skeleton lines={4} /> : (
              <div className="space-y-3">
                {breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{b.label}</span>
                      <span>{b.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 ${b.color} rounded-full transition-all`}
                        style={{ width: `${(b.count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planned backlog alert */}
          {!loading && planned.length > 0 && (
            <div className="card border-l-4 border-warning">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-warning-600" />
                <h3 className="text-sm font-semibold text-ink-800">Planned Backlog ({planned.length})</h3>
              </div>
              <div className="space-y-1">
                {planned.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex justify-between text-sm">
                    <span className="text-ink-700">{o.product?.name || o.productName || '—'}</span>
                    <span className="text-slate-500">×{o.quantity}</span>
                  </div>
                ))}
                {planned.length > 4 && <p className="text-xs text-slate-400">+{planned.length - 4} more</p>}
              </div>
              <Link to="/production_manager/manufacturing-orders" className="text-xs text-primary hover:underline mt-2 block">
                Start orders →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      {recentCompleted.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">Recent Completions</h3>
            <Link to="/production_manager/reports" className="text-xs text-primary hover:underline">View reports →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Quantity</th>
                  <th className="pb-2 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCompleted.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 font-mono text-xs text-primary">{o.reference}</td>
                    <td className="py-2 font-medium">{o.product?.name || o.productName || '—'}</td>
                    <td className="py-2 text-slate-600">{o.quantity}</td>
                    <td className="py-2 text-slate-500">
                      {o.completedAt ? new Date(o.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
