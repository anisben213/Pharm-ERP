import { useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { batchService } from '../../services/index.js';

export default function NonConformities() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => batchService.list().then((r) => r.batches), []);
  const nc = useMemo(() => (data || []).filter((b) => String(b.status).toLowerCase() === 'rejected'), [data]);
  const [saving, setSaving] = useState({});
  const [localActions, setLocalActions] = useState({});

  const saveAction = async (batch) => {
    const action = localActions[batch.id];
    if (!action?.trim()) { toast.warning('Enter a corrective action first'); return; }
    setSaving((s) => ({ ...s, [batch.id]: true }));
    try {
      await batchService.setCorrectiveAction(batch.id, action.trim());
      toast.success('Corrective action saved');
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    } finally { setSaving((s) => ({ ...s, [batch.id]: false })); }
  };

  return (
    <div>
      <PageHeader title="Non-Conformities" subtitle="Rejected batches with corrective actions." />
      <Table
        loading={loading}
        data={nc}
        searchKeys={['batchNumber', 'productName', 'correctiveAction']}
        columns={[
          { key: 'batchNumber', header: 'Batch #',  render: (r) => <span className="font-mono text-primary">{r.batchNumber}</span> },
          { key: 'productName', header: 'Product',  render: (r) => r.productName || r.product?.name },
          { key: 'status',      header: 'Status',   render: () => <Badge status="REJECTED" /> },
          { key: 'corrective',  header: 'Corrective Action', render: (r) => (
            <div className="flex gap-2 items-center min-w-[260px]" onClick={(e) => e.stopPropagation()}>
              <input
                value={localActions[r.id] !== undefined ? localActions[r.id] : (r.correctiveAction || '')}
                onChange={(e) => setLocalActions((s) => ({ ...s, [r.id]: e.target.value }))}
                placeholder="Add corrective action…"
                className="input text-sm flex-1"
              />
              <button
                className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                disabled={saving[r.id]}
                onClick={() => saveAction(r)}
              >{saving[r.id] ? '…' : 'Save'}</button>
            </div>
          )},
        ]}
        empty={{ icon: '✅', title: 'No non-conformities', message: 'All batches are conforming. Keep it up!' }}
      />
    </div>
  );
}

