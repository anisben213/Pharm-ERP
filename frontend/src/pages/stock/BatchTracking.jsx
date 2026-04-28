import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import { batchService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function BatchTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState(id || '');
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setTrace(null);
    try {
      // Try to fetch batch trace either by id or batch number
      const res = await batchService.trace(query.trim());
      setTrace(res);
      navigate(`/stock_manager/batches/${query.trim()}`, { replace: true });
    } catch {
      toast.error('Batch not found');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Batch Tracking" subtitle="Search a batch number to see its full history." />

      <form onSubmit={search} className="card mb-6 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink-800 mb-1.5">Batch Number</label>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. BAT-2026-001"
            className="input font-mono"
          />
        </div>
        <button className="btn-primary" disabled={loading || !query}>
          {loading ? 'Searching…' : '🔍 Search'}
        </button>
      </form>

      {loading && <Skeleton lines={4} />}

      {!loading && !trace && (
        <EmptyState icon="🔍" title="Search a batch" message="Enter a batch number above to see its production, quality and delivery history." />
      )}

      {!loading && trace && <Timeline trace={trace} />}
    </div>
  );
}

function Timeline({ trace }) {
  const events = trace?.events || trace?.timeline || [];
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label-xs">Batch</div>
          <div className="text-xl font-mono font-semibold text-ink-800">{trace.batchNumber || trace.batch?.batchNumber}</div>
        </div>
        {trace.status && <Badge status={trace.status.toLowerCase()} />}
      </div>

      {events.length === 0 ? (
        <EmptyState icon="📜" title="No history" message="No events recorded for this batch yet." />
      ) : (
        <ol className="relative border-l-2 border-slate-200 ml-4 space-y-4">
          {events.map((ev, i) => (
            <li key={i} className="ml-4 pl-2">
              <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-primary border-2 border-white" />
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="font-medium text-ink-800">{ev.label || ev.type}</span>
                <span className="text-xs text-slate-500">{ev.at ? new Date(ev.at).toLocaleString() : ''}</span>
              </div>
              {ev.detail && <div className="text-sm text-slate-600 mt-1">{ev.detail}</div>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
