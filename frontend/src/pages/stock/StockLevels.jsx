import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { stockService, productService } from '../../services/index.js';
import { Edit2, Check, X } from 'lucide-react';

export default function StockLevels() {
  const { data, loading, refetch } = useFetch(() => stockService.summary().then((r) => r.summary), []);
  const toast = useToast();
  const [editing, setEditing] = useState(null); // { productId, value }

  const startEdit = (row) => setEditing({ productId: row.productId, value: String(row.minLevel ?? 0) });
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (row) => {
    const val = Number(editing.value);
    if (isNaN(val) || val < 0) { toast.error('Min level must be a non-negative number'); return; }
    try {
      await productService.setMinLevel(row.productId, val);
      toast.success(`Min level updated for ${row.productName}`);
      setEditing(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update min level');
    }
  };

  return (
    <div>
      <PageHeader title="Stock Levels" subtitle="Current quantity per product. Click the pencil icon to set a minimum level." />
      <Table
        loading={loading}
        data={data || []}
        searchKeys={['productName', 'name', 'sku', 'category']}
        columns={[
          { key: 'sku',         header: 'SKU',      sortable: true, render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
          { key: 'productName', header: 'Product',  sortable: true, render: (r) => r.productName || r.name },
          { key: 'category',    header: 'Type',     sortable: true, render: (r) => r.category?.replace('_', ' ') || '—' },
          { key: 'unit',        header: 'Unit',     render: (r) => r.unit || '—' },
          { key: 'quantity',    header: 'Quantity', sortable: true, render: (r) => {
              const q = Number(r.quantity ?? 0);
              const m = Number(r.minLevel ?? 0);
              const isOut = q <= 0;
              const isLow = !isOut && q <= m;
              return <span className={`font-mono font-semibold ${isOut ? 'text-danger' : isLow ? 'text-warning-600' : 'text-success-600'}`}>{q}</span>;
            }
          },
          { key: 'minLevel',    header: 'Min Level', sortable: true, render: (r) => {
              const isEditing = editing?.productId === r.productId;
              if (isEditing) {
                return (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0" step="1"
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      className="w-20 border rounded px-1.5 py-0.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(r); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    <button onClick={() => saveEdit(r)} className="text-success-600 hover:text-success-700 p-0.5" title="Save"><Check size={14} /></button>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 p-0.5" title="Cancel"><X size={14} /></button>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1 group">
                  <span className="font-mono text-slate-600">{r.minLevel ?? 0}</span>
                  <button onClick={() => startEdit(r)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary p-0.5 transition-opacity" title="Edit min level">
                    <Edit2 size={13} />
                  </button>
                </div>
              );
            }
          },
          { key: 'status', header: 'Status', render: (r) => {
              const q = Number(r.quantity ?? 0), m = Number(r.minLevel ?? 0);
              if (q <= 0) return <Badge status="rejected" label="Out of stock" />;
              if (q <= m) return <Badge status="pending" label="Low" />;
              return <Badge status="active" label="OK" />;
            }
          },
        ]}
        empty={{ icon: '📈', title: 'No stock data', message: 'Stock summaries will appear once movements are recorded.' }}
      />
    </div>
  );
}
