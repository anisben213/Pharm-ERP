import { useMemo } from 'react';
import { BarChart3, CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productionService } from '../../services/index.js';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-ink-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function ProductionReports() {
  const { data, loading } = useFetch(() => productionService.list().then((r) => r.orders), []);
  const orders = data || [];

  const stats = useMemo(() => ({
    total:      orders.length,
    completed:  orders.filter((o) => o.status === 'COMPLETED').length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    planned:    orders.filter((o) => o.status === 'PLANNED').length,
    cancelled:  orders.filter((o) => o.status === 'CANCELLED').length,
  }), [orders]);

  const yieldRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const recentCompleted = useMemo(() =>
    orders
      .filter((o) => o.status === 'COMPLETED')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 10),
    [orders]
  );

  if (loading) return <div className="space-y-4"><Skeleton lines={3} /><Skeleton lines={5} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Production Reports" subtitle="Yield, order status and completion analytics." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BarChart3 size={22} className="text-primary-600" />}    label="Total Orders"   value={stats.total}      color="bg-primary-50" />
        <StatCard icon={<CheckCircle size={22} className="text-success-600" />}  label="Completed"      value={stats.completed}  color="bg-success-50" />
        <StatCard icon={<Clock size={22} className="text-warning-600" />}        label="In Progress"    value={stats.inProgress} color="bg-warning-50" />
        <StatCard icon={<XCircle size={22} className="text-danger" />}           label="Cancelled"      value={stats.cancelled}  color="bg-red-50" />
      </div>

      {/* Yield bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-ink-800">Completion Rate</span>
          <span className="text-lg font-bold text-success-700">{yieldRate}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${yieldRate}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">{stats.completed} completed out of {stats.total} total orders</p>
      </div>

      {/* Status breakdown */}
      <div className="card">
        <h3 className="font-semibold mb-3 text-ink-800">Status Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: 'Planned',     count: stats.planned,    color: 'bg-slate-400' },
            { label: 'In Progress', count: stats.inProgress, color: 'bg-warning' },
            { label: 'Completed',   count: stats.completed,  color: 'bg-success' },
            { label: 'Cancelled',   count: stats.cancelled,  color: 'bg-danger' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-24">{row.label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${row.color} rounded-full`} style={{ width: stats.total ? `${(row.count / stats.total) * 100}%` : '0%' }} />
              </div>
              <span className="text-sm font-mono w-8 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent completions */}
      <div>
        <h3 className="font-semibold mb-3 text-ink-800 flex items-center gap-2"><Package size={18} /> Recent Completions</h3>
        <Table
          data={recentCompleted}
          searchKeys={['reference', 'productName']}
          columns={[
            { key: 'reference',    header: 'Order #',    render: (r) => <span className="font-mono">{r.reference || r.id}</span> },
            { key: 'productName',  header: 'Product',    render: (r) => r.productName || r.product?.name || '—' },
            { key: 'quantity',     header: 'Qty',        render: (r) => <span className="font-mono">{r.quantity}</span> },
            { key: 'batchNumber',  header: 'Batch #',    render: (r) => { const bn = r.producedBatches?.[0]?.batchNumber; return bn ? <span className="font-mono text-primary">{bn}</span> : '—'; } },
            { key: 'updatedAt',    header: 'Completed',  sortable: true, render: (r) => new Date(r.updatedAt || r.createdAt).toLocaleDateString() },
            { key: 'status',       header: 'Status',     render: (r) => <Badge status={r.status} /> },
          ]}
          empty={{ icon: <BarChart3 size={40} />, title: 'No completions yet', message: 'Completed orders will appear here.' }}
        />
      </div>
    </div>
  );
}

