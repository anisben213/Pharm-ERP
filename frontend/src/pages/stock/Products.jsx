import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormModal from '../../components/forms/FormModal.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { productService } from '../../services/index.js';

export default function Products() {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(() => productService.list().then((r) => r.products), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sku: '', name: '', type: '', unit: 'unit' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.sku || form.sku.length < 2) e.sku = { message: 'SKU is required', show: true };
    if (!form.name) e.name = { message: 'Name is required', show: true };
    if (!form.type) e.type = { message: 'Type is required', show: true };
    return e;
  };

  const submit = async () => {
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    try {
      await productService.create(form);
      toast.success('Product created');
      setOpen(false);
      setForm({ sku: '', name: '', type: '', unit: 'unit' });
      setErrors({});
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create product');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Catalog of raw materials, finished products and packaging."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>➕ Add Product</button>}
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
          { key: 'sku',  header: 'SKU',  sortable: true, render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
          { key: 'name', header: 'Name', sortable: true },
          { key: 'type', header: 'Type', sortable: true, render: (r) => <Badge status={String(r.type).toLowerCase().replace('_', ' ')} label={r.type?.replace('_', ' ')} /> },
          { key: 'unit', header: 'Unit' },
        ]}
        empty={{ icon: '📦', title: 'No products yet', message: 'Add your first product to start tracking inventory.' }}
      />

      <FormModal
        open={open} onClose={() => setOpen(false)}
        title="Add Product"
        onSubmit={submit}
        loading={saving}
        submitLabel="Create"
      >
        <InputField  label="SKU"  name="sku"  value={form.sku}  onChange={(e) => setForm({ ...form, sku: e.target.value })}  required error={errors.sku} />
        <InputField  label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={errors.name} />
        <SelectField label="Type" name="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          required error={errors.type}
          options={[
            { value: 'RAW_MATERIAL',     label: 'Raw Material' },
            { value: 'FINISHED_PRODUCT', label: 'Finished Product' },
            { value: 'PACKAGING',        label: 'Packaging' },
          ]}
        />
        <InputField label="Unit" name="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
      </FormModal>
    </div>
  );
}
