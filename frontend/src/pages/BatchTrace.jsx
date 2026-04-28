import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { batchService, stockService } from '../services';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function BatchRow({ item }) {
  const b = item.batch;
  return (
    <li className="flex items-center gap-2 py-1.5 border-b last:border-b-0">
      <Link to={`/batches/${b.id}`} className="font-mono font-semibold text-blue-700 hover:underline">
        {b.batchNumber}
      </Link>
      <span className="text-slate-600 text-sm">{b.product?.name}</span>
      <StatusBadge value={b.status} />
      {item.consumedQty != null && (
        <span className="text-xs text-slate-500 ml-auto">consumed: {item.consumedQty}</span>
      )}
    </li>
  );
}

export default function BatchTrace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [recallResult, setRecallResult] = useState(null);

  const load = () => {
    setLoading(true);
    batchService.trace(id).then(setData).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  if (loading) return <div>Loading trace…</div>;
  if (!data) return <div>Not found</div>;

  const { batch, ancestors, descendants, sales } = data;
  const role = user?.role;
  const isQC = role === 'ADMIN' || role === 'QUALITY_CONTROLLER';
  const isRelease = role === 'ADMIN' || role === 'QUALITY_CONTROLLER' || role === 'PRODUCTION_MANAGER';
  const isStock = role === 'ADMIN' || role === 'STOCK_MANAGER';

  const changeStatus = async (status, prompt) => {
    if (prompt && !window.confirm(prompt)) return;
    setActing(true); setActionError(null);
    try {
      await batchService.updateStatus(batch.id, { status, version: batch.version });
      load();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message);
    } finally {
      setActing(false);
    }
  };

  const recall = async () => {
    const reason = window.prompt('Recall reason (visible in audit log):');
    if (reason === null) return;
    setActing(true); setActionError(null);
    try {
      const res = await batchService.recall(batch.id, reason);
      setRecallResult(res);
      load();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message);
    } finally {
      setActing(false);
    }
  };

  const block = async () => {
    const reason = window.prompt('Block reason?');
    if (reason === null) return;
    setActing(true); setActionError(null);
    try {
      await stockService.blockBatch(batch.id, reason);
      load();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message);
    } finally {
      setActing(false);
    }
  };

  // Possible transitions
  const canValidate = isQC && batch.status === 'IN_QUARANTINE';
  const canReject = isQC && (batch.status === 'IN_QUARANTINE' || batch.status === 'CREATED');
  const canRelease = isRelease && batch.status === 'APPROVED';
  const canRecall = isQC && (batch.status === 'RELEASED' || batch.status === 'SOLD' || batch.status === 'APPROVED');
  const canBlock = isStock && !['REJECTED', 'RECALLED', 'EXPIRED'].includes(batch.status);

  return (
    <div>
      <PageHeader title={`Batch ${batch.batchNumber}`} subtitle="Full genealogy" />

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">{actionError}</div>
      )}

      {recallResult && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded mb-4">
          <div className="font-semibold mb-1">Recall executed</div>
          {recallResult.affectedCustomers?.length ? (
            <div className="text-sm">
              <div className="mb-1">Affected customers ({recallResult.affectedCustomers.length}):</div>
              <ul className="list-disc list-inside">
                {recallResult.affectedCustomers.map((c) => (
                  <li key={c.id}>{c.name}{c.email ? ` — ${c.email}` : ''}</li>
                ))}
              </ul>
            </div>
          ) : <div className="text-sm">No customer sales linked to this batch yet.</div>}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-5 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-slate-500">Product</div><div className="font-medium">{batch.product?.name}</div></div>
          <div><div className="text-slate-500">Type</div><div className="font-medium">{batch.product?.type}</div></div>
          <div><div className="text-slate-500">Status</div><StatusBadge value={batch.status} /></div>
          <div><div className="text-slate-500">Remaining</div><div className="font-medium">{batch.remainingQty}</div></div>
          <div><div className="text-slate-500">Manufactured</div><div className="font-medium">{batch.manufacturedAt?.slice(0, 10) || '—'}</div></div>
          <div><div className="text-slate-500">Expiry</div><div className="font-medium">{batch.expiryDate?.slice(0, 10) || '—'}</div></div>
          <div><div className="text-slate-500">Quantity</div><div className="font-medium">{batch.quantity}</div></div>
          <div><div className="text-slate-500">Version</div><div className="font-medium">{batch.version}</div></div>
        </div>

        {(canValidate || canReject || canRelease || canRecall || canBlock) && (
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t">
            {canValidate && (
              <button disabled={acting} onClick={() => changeStatus('APPROVED', 'Validate & approve this batch?')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50">
                ✓ Validate (Approve)
              </button>
            )}
            {canReject && (
              <button disabled={acting} onClick={() => changeStatus('REJECTED', 'Reject this batch? Stock cannot be used for sales/production.')}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50">
                ✕ Reject
              </button>
            )}
            {canRelease && (
              <button disabled={acting} onClick={() => changeStatus('RELEASED', 'Release this batch to sellable stock?')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
                → Release
              </button>
            )}
            {canRecall && (
              <button disabled={acting} onClick={recall}
                className="px-3 py-1.5 bg-rose-700 text-white text-sm rounded hover:bg-rose-800 disabled:opacity-50">
                ⚠ Recall
              </button>
            )}
            {canBlock && (
              <button disabled={acting} onClick={block}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50">
                ⛔ Block
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-3 text-slate-700">Upstream (Raw Materials Used)</h2>
          {ancestors?.length ? (
            <ul>{ancestors.map((n, i) => <BatchRow key={n.batch.id + i} item={n} />)}</ul>
          ) : (
            <p className="text-slate-400 text-sm">No upstream batches</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-3 text-slate-700">Downstream (Produced Batches)</h2>
          {descendants?.length ? (
            <ul>{descendants.map((n, i) => <BatchRow key={n.batch.id + i} item={n} />)}</ul>
          ) : (
            <p className="text-slate-400 text-sm">No downstream batches</p>
          )}
        </div>
      </div>

      {sales?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mt-5">
          <h2 className="font-semibold mb-3 text-slate-700">Sales / Distribution</h2>
          <ul className="text-sm space-y-1">
            {sales.map((s) => (
              <li key={s.id}>
                SO #{s.order?.reference} — {s.order?.customer?.name} — qty {s.quantity} ({s.order?.createdAt?.slice(0, 10)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
