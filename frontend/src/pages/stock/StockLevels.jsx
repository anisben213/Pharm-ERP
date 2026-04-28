import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { stockService } from '../../services/index.js';

export default function StockLevels() {
  const { data, loading } = useFetch(() => stockService.summary().then((r) => r.summary), []);

  return (
    <div>
      <PageHeader title="Stock Levels" subtitle="Current quantity per product across all locations." />
      <Table
        loading={loading}
        data={data || []}
        searchKeys={['productName', 'name', 'sku', 'category']}
        columns={[
          { key: 'productName', header: 'Product',  sortable: true, render: (r) => r.productName || r.name },
          { key: 'category',    header: 'Category', sortable: true },
          { key: 'quantity',    header: 'Quantity', sortable: true, render: (r) => <span className="font-mono">{r.quantity ?? 0}</span> },
          { key: 'minLevel',    header: 'Min Level',sortable: true, render: (r) => <span className="font-mono text-slate-500">{r.minLevel ?? 0}</span> },
          { key: 'status',      header: 'Status',   render: (r) => {
              const q = Number(r.quantity ?? 0), m = Number(r.minLevel ?? 0);
              if (q <= 0) return <Badge status="rejected" label="Out of stock" />;
              if (q <= m) return <Badge status="pending" label="Low" />;
              return <Badge status="active" label="OK" />;
            }
          },
          { key: 'locations',   header: 'Locations', render: (r) => r.locations?.join(', ') || '—' },
        ]}
        empty={{ icon: '📈', title: 'No stock data', message: 'Stock summaries will appear once movements are recorded.' }}
      />
    </div>
  );
}
