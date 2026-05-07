import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import { stockService } from '../../services/index.js';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setMovements(await stockService.movements()); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <Table
      columns={[
        {
          key: 'createdAt',
          header: 'Date',
          sortable: true,
          accessor: (m) => m.createdAt,
          render: (m) => new Date(m.createdAt).toLocaleString(),
        },
        {
          key: 'type',
          header: 'Type',
          render: (m) => (
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${m.type === 'ENTRY' ? 'text-success-700' : 'text-danger-700'}`}>
              {m.type === 'ENTRY' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
              {m.type}
            </span>
          ),
        },
        {
          key: 'batchNumber',
          header: 'Batch',
          accessor: (m) => m.batch?.batchNumber,
          render: (m) => m.batch?.batchNumber ? (
            <Link to={`/stock_manager/batch-tracking/${encodeURIComponent(m.batch.batchNumber)}`}
              className="text-primary hover:underline">{m.batch.batchNumber}</Link>
          ) : '—',
        },
        { key: 'product', header: 'Product', accessor: (m) => m.batch?.product?.name },
        { key: 'quantity', header: 'Quantity', render: (m) => `${m.quantity} ${m.batch?.product?.unit || ''}` },
        { key: 'reason', header: 'Reason', render: (m) => m.reason || '—' },
      ]}
      data={movements}
      loading={loading}
      searchKeys={['reason']}
      empty={{ icon: '🔄', title: 'No movements', message: 'Stock movements will appear here.' }}
    />
  );
}
