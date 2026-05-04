import { useMemo } from 'react';
import KPICard from '../../components/common/KPICard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Clock, XCircle, CheckCircle, AlertOctagon, ShieldCheck, FlaskConical } from 'lucide-react';
import { batchService, qualityService } from '../../services/index.js';
import { Link } from 'react-router-dom';

export default function QualityDashboard() {
  const { data, loading }           = useFetch(() => batchService.list().then((r) => r.batches), []);
  const { data: checks, loading: lq } = useFetch(() => qualityService.list().then((r) => r.checks).catch(() => []), []);

  const all    = data || [];
  const allChecks = checks || [];

  const quarantine = all.filter((b) => b.status === 'IN_QUARANTINE');
  const rejected   = all.filter((b) => b.status === 'REJECTED');
  const recalled   = all.filter((b) => b.status === 'RECALLED');
  const approved   = all.filter((b) => b.status === 'APPROVED' || b.status === 'RELEASED');
  const total      = approved.length + rejected.length;
  const conformity = total > 0 ? Math.round((approved.length / total) * 100) : 100;

  // Recent QC checks
  const recentChecks = useMemo(() =>
    [...allChecks].sort((a, b) => new Date(b.inspectedAt || b.createdAt) - new Date(a.inspectedAt || a.createdAt)).slice(0, 6),
    [allChecks]
  );

  // NC batches needing corrective action
  const ncPending = rejected.filter((b) => !b.correctiveAction);

  return (
    <div className="space-y-6">
      <PageHeader title="Quality Dashboard" subtitle="Validation backlog, conformity rate and recalls." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className={quarantine.length > 0 ? 'ring-2 ring-warning rounded-xl' : ''}>
          <KPICard icon={<Clock size={22} />}         label="In Quarantine"     value={quarantine.length}   color="warning" loading={loading} />
        </div>
        <KPICard icon={<XCircle size={22} />}         label="Non-Conformities"  value={rejected.length}     color="danger"  loading={loading} />
        <KPICard icon={<AlertOctagon size={22} />}    label="Active Recalls"    value={recalled.length}     color="purple"  loading={loading} />
        <KPICard icon={<CheckCircle size={22} />}     label="Approved Batches"  value={approved.length}     color="success" loading={loading} />
        <KPICard icon={<ShieldCheck size={22} />}     label="Conformity Rate"   value={`${conformity}%`}    color="success" loading={loading} />
        <KPICard icon={<FlaskConical size={22} />}    label="QC Checks Done"    value={allChecks.length}    color="slate"   loading={lq} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Validation Queue */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800">
              Validation Queue
              {quarantine.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-warning text-white rounded-full">{quarantine.length}</span>}
            </h3>
            <Link to="/quality_manager/validation" className="text-xs text-primary hover:underline">Open queue →</Link>
          </div>
          {loading ? <Skeleton lines={5} /> : quarantine.length === 0
            ? <p className="text-sm text-slate-400 py-4 text-center">✅ No batches pending validation.</p>
            : (
              <div className="divide-y divide-slate-100">
                {quarantine.slice(0, 8).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-mono text-primary">{b.batchNumber}</p>
                      <p className="text-xs text-slate-500">{b.productName || b.product?.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {b.manufacturedAt ? new Date(b.manufacturedAt).toLocaleDateString() : '—'}
                      </span>
                      <Badge status={b.status} />
                    </div>
                  </div>
                ))}
                {quarantine.length > 8 && (
                  <p className="text-xs text-slate-400 pt-2">+{quarantine.length - 8} more batches awaiting review</p>
                )}
              </div>
            )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Conformity gauge */}
          <div className="card text-center">
            <h3 className="font-semibold text-ink-800 mb-4">Conformity Rate</h3>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28" viewBox="0 0 36 36">
                <path className="text-slate-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path
                  className={`stroke-current ${conformity >= 90 ? 'text-success' : conformity >= 70 ? 'text-warning-500' : 'text-danger'}`}
                  strokeWidth="3" strokeDasharray={`${conformity}, 100`} fill="none" strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${conformity >= 90 ? 'text-success-700' : conformity >= 70 ? 'text-warning-700' : 'text-danger'}`}>{conformity}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{approved.length} approved / {total} evaluated</p>
          </div>

          {/* Recent QC checks */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-ink-800">Recent Checks</h3>
              <Link to="/quality_manager/control-files" className="text-xs text-primary hover:underline">All →</Link>
            </div>
            {lq ? <Skeleton lines={4} /> : recentChecks.length === 0
              ? <p className="text-sm text-slate-400">No checks yet.</p>
              : (
                <div className="space-y-2">
                  {recentChecks.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-primary">{c.batch?.batchNumber || '—'}</span>
                      <Badge status={c.result} />
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Non-conformities needing corrective action */}
      {ncPending.length > 0 && (
        <div className="card border-l-4 border-danger">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={18} className="text-danger" />
            <h3 className="font-semibold text-ink-800">Non-Conformities Without Corrective Action ({ncPending.length})</h3>
            <Link to="/quality_manager/non-conformities" className="ml-auto text-xs text-primary hover:underline">Manage →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {ncPending.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-sm text-primary">{b.batchNumber}</span>
                <span className="text-sm text-slate-600">{b.productName || b.product?.name || '—'}</span>
                <span className="text-xs text-danger font-medium">Action required</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Recalls */}
      {recalled.length > 0 && (
        <div className="card border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon size={18} className="text-purple-600" />
            <h3 className="font-semibold text-ink-800">Active Recalls ({recalled.length})</h3>
            <Link to="/quality_manager/recalls" className="ml-auto text-xs text-primary hover:underline">View recalls →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recalled.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-sm text-primary">{b.batchNumber}</span>
                <span className="text-sm text-slate-600">{b.productName || b.product?.name || '—'}</span>
                <Badge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

