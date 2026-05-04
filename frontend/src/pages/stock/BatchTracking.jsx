import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, FlaskConical, ArrowLeftRight, CheckCircle, XCircle, Clock, GitBranch, ShoppingCart, Package } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import { batchService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

const TABS = [
  { key: 'movements', label: 'Movements', icon: ArrowLeftRight },
  { key: 'quality',   label: 'Quality',   icon: FlaskConical },
  { key: 'genealogy', label: 'Genealogy', icon: GitBranch },
  { key: 'sales',     label: 'Sales',     icon: ShoppingCart },
];

const TYPE_COLOR = {
  IN_PURCHASE:  'text-success bg-success/10',
  IN_PRODUCTION:'text-success bg-success/10',
  OUT_PRODUCTION:'text-warning bg-warning/10',
  OUT_SALES:    'text-primary bg-primary/10',
  ADJUSTMENT:   'text-slate-600 bg-slate-100',
  RECALL:       'text-danger bg-danger/10',
};

export default function BatchTracking() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState(paramId || '');
  const [batch, setBatch] = useState(null);
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('movements');

  const search = async (e, q) => {
    e?.preventDefault();
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    setBatch(null);
    setTrace(null);
    try {
      const [b, t] = await Promise.all([
        batchService.get(term),
        batchService.trace(term).catch(() => null),
      ]);
      setBatch(b);
      setTrace(t);
      navigate(`/stock_manager/batches/${term}`, { replace: true });
    } catch {
      toast.error('Batch not found — check the batch number and try again');
    } finally { setLoading(false); }
  };

  // Auto-search if arriving with a URL param
  useEffect(() => {
    if (paramId && !batch) search(null, paramId);
  }, [paramId]); // eslint-disable-line

  return (
    <div>
      <PageHeader title="Batch Tracking" subtitle="Full end-to-end traceability for any batch." />

      <form onSubmit={search} className="card mb-6 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink-800 mb-1.5">Batch Number</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. LOT-2026-001 or B-PO-2026-001-abc123"
            className="input font-mono"
          />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading || !query}>
          <Search size={16} />
          {loading ? 'Searching…' : 'Track Batch'}
        </button>
      </form>

      {loading && <Skeleton lines={6} />}

      {!loading && !batch && (
        <EmptyState
          icon={<Search size={40} />}
          title="Search a batch"
          message="Enter a batch number to view its full history: movements, quality checks, genealogy and deliveries."
        />
      )}

      {!loading && batch && (
        <>
          {/* Batch header */}
          <div className="card mb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="label-xs mb-1">Batch Number</div>
                <div className="text-2xl font-mono font-bold text-ink-800">{batch.batchNumber}</div>
                <div className="text-slate-600 mt-1">{batch.product?.name} <span className="text-xs text-slate-400 ml-1">({batch.product?.sku})</span></div>
              </div>
              <Badge status={batch.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
              <Stat label="Quantity"    value={`${Number(batch.quantity)} ${batch.product?.unit || ''}`} />
              <Stat label="Remaining"   value={`${Number(batch.remainingQty)} ${batch.product?.unit || ''}`} />
              <Stat label="Manufactured" value={batch.manufacturedAt ? new Date(batch.manufacturedAt).toLocaleDateString() : '—'} />
              <Stat label="Expiry"       value={batch.expiryDate     ? new Date(batch.expiryDate).toLocaleDateString()     : '—'} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-card w-fit">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'movements' && <MovementsTab movements={batch.stockMovements || []} />}
          {tab === 'quality'   && <QualityTab   checks={batch.qualityChecks   || []} />}
          {tab === 'genealogy' && <GenealogyTab batch={batch} trace={trace} />}
          {tab === 'sales'     && <SalesTab     lines={batch.salesLines || []} />}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="label-xs mb-0.5">{label}</div>
      <div className="font-medium text-ink-800">{value}</div>
    </div>
  );
}

function MovementsTab({ movements }) {
  if (movements.length === 0)
    return <EmptyState icon={<ArrowLeftRight size={40} />} title="No movements" message="No stock movements recorded for this batch." />;
  return (
    <div className="card">
      <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
        {movements.map((m, i) => (
          <li key={m.id || i} className="ml-5 pl-2">
            <span className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${m.type?.startsWith('IN') ? 'bg-success' : 'bg-warning'}`} />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[m.type] || 'text-slate-600 bg-slate-100'}`}>
                {m.type?.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-sm text-ink-800">
              Qty: <span className="font-mono font-semibold">{Number(m.quantity)}</span>
              {m.reference && <span className="ml-3 text-slate-500 text-xs font-mono">Ref: {m.reference}</span>}
              {m.note && <span className="ml-3 text-slate-500 text-xs">{m.note}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function QualityTab({ checks }) {
  if (checks.length === 0)
    return <EmptyState icon={<FlaskConical size={40} />} title="No quality checks" message="No QC results recorded for this batch." />;
  return (
    <div className="card space-y-3">
      {checks.map((c, i) => {
        const Icon = c.result === 'PASSED' ? CheckCircle : c.result === 'FAILED' ? XCircle : Clock;
        const color = c.result === 'PASSED' ? 'text-success' : c.result === 'FAILED' ? 'text-danger' : 'text-warning';
        return (
          <div key={c.id || i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <Icon size={20} className={`mt-0.5 flex-shrink-0 ${color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`font-semibold ${color}`}>{c.result}</span>
                <span className="text-xs text-slate-500">{new Date(c.inspectedAt).toLocaleString()}</span>
              </div>
              {c.notes && <p className="text-sm text-slate-600 mt-1">{c.notes}</p>}
              {c.inspectedBy && <p className="text-xs text-slate-400 mt-0.5">Inspector: {c.inspectedBy.fullName}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GenealogyTab({ batch, trace }) {
  const ancestors   = trace?.ancestors   || batch.parentLinks?.map((l) => ({ batch: l.parentBatch, consumedQty: l.consumedQty })) || [];
  const descendants = trace?.descendants || batch.childLinks?.map( (l) => ({ batch: l.childBatch,  consumedQty: l.consumedQty })) || [];

  if (ancestors.length === 0 && descendants.length === 0)
    return <EmptyState icon={<GitBranch size={40} />} title="No genealogy" message="This batch has no linked parent or child batches." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-700"><Package size={16} /> Raw Materials Used ({ancestors.length})</h3>
        {ancestors.length === 0
          ? <p className="text-sm text-slate-400">None</p>
          : <ul className="space-y-2">
              {ancestors.map((a, i) => (
                <li key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50">
                  <div>
                    <div className="font-mono text-primary text-xs">{a.batch?.batchNumber}</div>
                    <div className="text-slate-600">{a.batch?.product?.name}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">Consumed: {Number(a.consumedQty)}</div>
                </li>
              ))}
            </ul>
        }
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-700"><GitBranch size={16} /> Produced From This ({descendants.length})</h3>
        {descendants.length === 0
          ? <p className="text-sm text-slate-400">None</p>
          : <ul className="space-y-2">
              {descendants.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50">
                  <div>
                    <div className="font-mono text-primary text-xs">{d.batch?.batchNumber}</div>
                    <div className="text-slate-600">{d.batch?.product?.name}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">Used: {Number(d.consumedQty)}</div>
                </li>
              ))}
            </ul>
        }
      </div>
    </div>
  );
}

function SalesTab({ lines }) {
  if (lines.length === 0)
    return <EmptyState icon={<ShoppingCart size={40} />} title="Not sold" message="This batch has not been included in any sales order." />;
  return (
    <div className="card space-y-3">
      {lines.map((l, i) => (
        <div key={l.id || i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm">
          <div>
            <div className="font-mono text-primary text-xs">{l.order?.reference}</div>
            <div className="text-slate-600 mt-0.5">{l.order?.customer?.name}</div>
          </div>
          <div className="text-right">
            <div className="font-mono font-semibold">{Number(l.quantity)} units</div>
            <Badge status={l.order?.status?.toLowerCase()} />
          </div>
        </div>
      ))}
    </div>
  );
}
