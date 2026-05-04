import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { batchService, qualityService } from '../../services/index.js';

const PARAMETERS = [
  { key: 'pH',            label: 'pH',                 unit: '' },
  { key: 'concentration', label: 'Concentration',      unit: 'mg/mL' },
  { key: 'humidity',      label: 'Humidity',           unit: '%' },
  { key: 'appearance',    label: 'Visual Appearance',  unit: '' },
];

export default function EnterResults() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const pending = (data || []).filter((b) => String(b.status).toLowerCase() === 'pending');

  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const open = (b) => {
    setSelected(b);
    setResults(Object.fromEntries(PARAMETERS.map((p) => [p.key, { pass: true, value: '' }])));
    setNotes('');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const anyFail = Object.values(results).some((r) => !r.pass);
      const result = anyFail ? 'FAILED' : 'PASSED';
      await qualityService.inspect({
        batchId: selected.id,
        result,
        notes,
      });
      if (anyFail) toast.info('Quality Manager has been alerted (failed parameters).');
      toast.success('Results submitted');
      setSelected(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit');
    } finally { setSaving(false); }
  };

  if (loading) return <Skeleton lines={4} />;

  return (
    <div>
      <PageHeader title="Enter Results" subtitle="Record analysis parameters for batches awaiting QC." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1">
          <h3 className="font-semibold text-ink-800 mb-3">Pending Batches ({pending.length})</h3>
          {pending.length === 0
            ? <EmptyState icon="✅" title="Nothing pending" message="All assigned batches have been analyzed." />
            : (
              <ul className="space-y-2">
                {pending.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => open(b)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        selected?.id === b.id
                          ? 'border-primary bg-primary-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-mono text-primary text-sm">{b.batchNumber}</div>
                      <div className="text-sm">{b.productName || b.product?.name}</div>
                      <div className="mt-1"><Badge status="pending" /></div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </aside>

        <section className="lg:col-span-2">
          {!selected
            ? <div className="card"><EmptyState icon={<FlaskConical size={40} />} title="Select a batch" message="Pick a batch on the left to enter analysis results." /></div>
            : (
              <form onSubmit={save} className="card">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="label-xs">Batch</div>
                    <div className="font-mono text-primary text-lg">{selected.batchNumber}</div>
                  </div>
                  <Badge status="pending" />
                </div>

                <div className="space-y-3">
                  {PARAMETERS.map((p) => (
                    <div key={p.key} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 rounded-lg p-3">
                      <label className="sm:col-span-4 text-sm font-medium text-ink-800">{p.label}</label>
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <input
                          className="input"
                          placeholder="Result value"
                          value={results[p.key]?.value || ''}
                          onChange={(e) => setResults((r) => ({ ...r, [p.key]: { ...r[p.key], value: e.target.value } }))}
                        />
                        {p.unit && <span className="text-xs text-slate-500 w-12">{p.unit}</span>}
                      </div>
                      <div className="sm:col-span-3 flex gap-1">
                        {['pass', 'fail'].map((opt) => {
                          const isPass = opt === 'pass';
                          const active = results[p.key]?.pass === isPass;
                          return (
                            <button
                              key={opt} type="button"
                              onClick={() => setResults((r) => ({ ...r, [p.key]: { ...r[p.key], pass: isPass } }))}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                active
                                  ? isPass ? 'bg-success text-white' : 'bg-danger text-white'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >{opt.toUpperCase()}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-ink-800 mb-1.5">Notes</label>
                  <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="flex justify-end mt-4">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Submitting…' : '✓ Submit Results'}
                  </button>
                </div>
              </form>
            )}
        </section>
      </div>
    </div>
  );
}
