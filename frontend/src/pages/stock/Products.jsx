import { Package } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import useFetch from '../../hooks/useFetch.js';
import { productService } from '../../services/index.js';

export default function Products() {
  const { data, loading } = useFetch(() => productService.list().then((r) => r.products), []);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Catalog of raw materials, finished products and packaging."
      />

      <Table
        loading={loading}
        data={data || []}
        searchKeys={['sku', 'name']}
        filters={[{
          key: 'type', label: 'All types', options: [
            { value: 'RAW_MATERIAL', label: 'Raw Material' },
            { value: 'FINISHED_PRODUCT', label: 'Finished Product' },
            { value: 'PACKAGING', label: 'Packaging' },
          ]
        }]}
        columns={[
          { key: 'sku',         header: 'SKU',       sortable: true, render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
          { key: 'name',        header: 'Name',      sortable: true },
          { key: 'type',        header: 'Type',      sortable: true, render: (r) => <Badge status={String(r.type).toLowerCase().replace('_', ' ')} label={r.type?.replace('_', ' ')} /> },
          { key: 'unit',        header: 'Unit' },
          { key: 'minLevel',    header: 'Min Level', render: (r) => <span className="font-mono text-slate-500">{Number(r.minLevel ?? 0)}</span> },
          { key: 'description', header: 'Description', render: (r) => <span className="text-slate-500 text-xs">{r.description || '—'}</span> },
        ]}
        empty={{ icon: <Package size={40} />, title: 'No products yet', message: 'Products are added by the Purchaser.' }}
      />
    </div>
  );
}
