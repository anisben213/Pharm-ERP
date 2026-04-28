import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import api from '../../services/api.js';

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, loading } = useFetch(
    () => api.get(`/production/${id}`).then((r) => r.data),
    [id]
  );

  if (loading) return <Skeleton lines={6} />;
  if (!order) return <EmptyState icon="❓" title="Order not found" message="This order does not exist or has been deleted." />;

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber || order.id}`}
        subtitle={order.product?.name}
        actions={<Badge status={order.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold mb-3">Order Info</h3>
          <dl className="text-sm space-y-2">
            <Row label="Batch Number" value={order.batchNumber
              ? <Link to={`/stock_manager/batches/${order.batchNumber}`} className="font-mono text-primary hover:underline">{order.batchNumber}</Link>
              : '—'}
            />
            <Row label="Quantity" value={order.quantity} />
            <Row label="Planned" value={order.plannedDate ? new Date(order.plannedDate).toLocaleDateString() : '—'} />
            <Row label="Operator" value={order.operator?.fullName || '—'} />
          </dl>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-3">Raw Material Consumption</h3>
          {(order.consumption || []).length === 0
            ? <EmptyState icon="🧪" title="No consumption recorded" message="Raw materials will appear here once production starts." />
            : (
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr><th className="label-xs pb-2">Material</th><th className="label-xs pb-2">Batch</th><th className="label-xs pb-2 text-right">Qty</th></tr>
                </thead>
                <tbody>
                  {order.consumption.map((c, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-2">{c.product?.name || c.productName}</td>
                      <td className="py-2 font-mono text-xs text-primary">{c.batchNumber || '—'}</td>
                      <td className="py-2 text-right font-mono">{c.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-ink-800 font-medium">{value}</dd>
    </div>
  );
}
