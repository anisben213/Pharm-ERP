import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import useFetch from '../../hooks/useFetch.js';
import api from '../../services/api.js';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const { data: order, loading } = useFetch(() => api.get(`/sales/${id}`).then((r) => r.data), [id]);

  if (loading) return <Skeleton lines={5} />;
  if (!order) return <EmptyState icon="❓" title="Order not found" message="This order could not be loaded." />;

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber || order.id}`}
        subtitle={order.customer?.name}
        actions={<Badge status={order.status} />}
      />

      <div className="card">
        <h3 className="font-semibold mb-3">Items & Traceability</h3>
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="label-xs pb-2">Product</th>
              <th className="label-xs pb-2">Batch #</th>
              <th className="label-xs pb-2 text-right">Qty</th>
              <th className="label-xs pb-2 text-right">Unit</th>
              <th className="label-xs pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines || []).map((l, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-2">{l.product?.name || l.productName}</td>
                <td className="py-2">
                  {l.batchNumber
                    ? <Link to={`/stock_manager/batches/${l.batchNumber}`} className="font-mono text-primary hover:underline">{l.batchNumber}</Link>
                    : '—'}
                </td>
                <td className="py-2 text-right font-mono">{l.quantity}</td>
                <td className="py-2 text-right font-mono">{Number(l.unitPrice ?? 0).toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{(Number(l.unitPrice ?? 0) * Number(l.quantity ?? 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
