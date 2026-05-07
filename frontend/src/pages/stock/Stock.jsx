import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/common/Table.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { stockService } from '../../services/index.js';

const TABS = [
  { key: 'finished', label: 'Finished Products' },
  { key: 'raw', label: 'Raw Materials' },
  { key: 'blocked', label: 'Blocked' },
];

export default function Stock() {
  const [data, setData] = useState({ finished: [], raw: [], blocked: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('finished');

  useEffect(() => {
    (async () => {
      try { setData(await stockService.list()); }
      finally { setLoading(false); }
    })();
  }, []);

  const rows = data[tab] || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-card p-1.5 flex gap-1 inline-flex w-auto self-start">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              tab === t.key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label} <span className="opacity-70 ml-1">({data[t.key]?.length || 0})</span>
          </button>
        ))}
      </div>

      <Table
        columns={[
          {
            key: 'batchNumber',
            header: 'Batch Number',
            sortable: true,
            render: (b) => (
              <Link
                to={`/stock_manager/batch-tracking/${encodeURIComponent(b.batchNumber)}`}
                className="text-primary font-medium hover:underline"
              >{b.batchNumber}</Link>
            ),
          },
          { key: 'product', header: 'Product', accessor: (b) => b.product?.name, sortable: true },
          { key: 'quantity', header: 'Quantity', render: (b) => `${b.quantity} ${b.product?.unit || ''}` },
          {
            key: 'expiryDate',
            header: 'Expiry Date',
            sortable: true,
            accessor: (b) => b.expiryDate,
            render: (b) => b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—',
          },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
        ]}
        data={rows}
        loading={loading}
        searchKeys={['batchNumber']}
        empty={{ icon: '📦', title: 'No batches', message: 'Nothing in this category yet.' }}
      />
    </div>
  );
}
