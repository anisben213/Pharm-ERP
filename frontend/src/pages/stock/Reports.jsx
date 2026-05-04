import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Badge from '../../components/common/Badge.jsx';
import { stockService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

function toCSV(rows) {
  const headers = ['Date', 'Product', 'Batch #', 'Type', 'Quantity', 'Reference', 'Note'];
  const lines = rows.map((r) => [
    new Date(r.createdAt).toLocaleString(),
    r.productName || '',
    r.batchNumber || '',
    r.type || '',
    r.quantity || 0,
    r.reference || '',
    r.note || '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...lines].join('\n');
}

export default function Reports() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { movements } = await stockService.movements();
      setRows(movements || []);
    } catch {
      toast.error('Failed to load report data');
    } finally { setLoading(false); }
  };

  const download = () => {
    if (!rows) return;
    const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and export stock movement reports."
        actions={
          rows
            ? <button className="btn-primary" onClick={download}><Download size={16} /> Download CSV</button>
            : <button className="btn-outline" onClick={generate} disabled={loading}>
                <FileText size={16} /> {loading ? 'Generating…' : 'Generate Report'}
              </button>
        }
      />

      {loading && <div className="card"><Skeleton lines={5} /></div>}

      {!loading && rows && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">{rows.length} movements found</span>
            <button className="btn-ghost text-sm" onClick={() => setRows(null)}>Reset</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                {['Date', 'Product', 'Batch #', 'Type', 'Qty', 'Reference', 'Note'].map((h) => (
                  <th key={h} className="label-xs pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-medium text-ink-800">{r.productName}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-primary">{r.batchNumber}</td>
                  <td className="py-2 pr-4"><Badge status={r.typeGroup === 'IN' ? 'active' : 'pending'} label={r.type?.replace(/_/g, ' ')} /></td>
                  <td className="py-2 pr-4 font-mono">{r.quantity}</td>
                  <td className="py-2 pr-4 text-xs text-slate-500 font-mono">{r.reference || '—'}</td>
                  <td className="py-2 text-xs text-slate-600">{r.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !rows && (
        <div className="card text-center py-12 text-slate-500">
          <FileText size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Click "Generate Report" to load all movements</p>
          <p className="text-xs mt-1">Then use "Download CSV" to export the data</p>
        </div>
      )}
    </div>
  );
}
