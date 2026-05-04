import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { ConfirmModal } from '../../components/common/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { salesService } from '../../services/index.js';
import api from '../../services/api.js';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, refetch } = useFetch(() => api.get(`/sales/${id}`).then((r) => r.data), [id]);
  const [delivering, setDelivering] = useState(false);
  const [returning, setReturning] = useState(false);
  const [acting, setActing] = useState(false);

  const doDeliver = async () => {
    setActing(true);
    try {
      await salesService.deliver(id);
      toast.success('Order marked as delivered');
      setDelivering(false);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    } finally { setActing(false); }
  };

  const doReturn = async () => {
    setActing(true);
    try {
      await salesService.returnOrder(id);
      toast.success('Return processed — stock restored');
      setReturning(false);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    } finally { setActing(false); }
  };

  if (loading) return <Skeleton lines={5} />;
  if (!order) return <EmptyState icon="❓" title="Order not found" message="This order could not be loaded." />;

  return (
    <div>
      <PageHeader
        title={`Order ${order.reference || order.id}`}
        subtitle={order.customer?.name}
        actions={
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
            {order.status === 'CONFIRMED' && (
              <button className="btn-success" onClick={() => setDelivering(true)}><Truck size={15} /> Deliver</button>
            )}
            {order.status === 'DELIVERED' && (
              <button className="btn-outline" onClick={() => setReturning(true)}><RotateCcw size={15} /> Return</button>
            )}
          </div>
        }
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
                  {l.batch?.batchNumber
                    ? <Link to={`/stock_manager/batches/${l.batch.batchNumber}`} className="font-mono text-primary hover:underline">{l.batch.batchNumber}</Link>
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

      <ConfirmModal
        open={delivering}
        onClose={() => setDelivering(false)}
        title="Confirm Delivery"
        message={`Mark order ${order.reference} as DELIVERED?`}
        confirmLabel="Deliver"
        loading={acting}
        onConfirm={doDeliver}
      />
      <ConfirmModal
        open={returning}
        onClose={() => setReturning(false)}
        title="Process Return"
        message={`Mark order ${order.reference} as RETURNED? Batch quantities will be restored to stock.`}
        confirmLabel="Confirm Return"
        loading={acting}
        onConfirm={doReturn}
        destructive
      />
    </div>
  );
}
