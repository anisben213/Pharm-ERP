import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { productService } from '../../services/index.js';
import { useToast } from '../../hooks/useToast.js';

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setProducts(await productService.list()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Table
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'category', header: 'Category', render: (p) => <StatusBadge status={p.category} /> },
          { key: 'unit', header: 'Unit' },
          { key: 'unitPrice', header: 'Unit Price', render: (p) => `${Number(p.unitPrice || 0).toLocaleString()} DZD` },
          { key: 'minStockLevel', header: 'Min. Level', render: (p) => `${p.minStockLevel} ${p.unit}` },
        ]}
        data={products}
        loading={loading}
        searchKeys={['name', 'unit']}
        filters={[{
          key: 'category',
          label: 'All categories',
          options: [
            { value: 'FINISHED_PRODUCT', label: 'Finished products' },
            { value: 'RAW_MATERIAL', label: 'Raw materials' },
          ],
        }]}
        rightToolbar={(
          <ActionButton icon={<Plus size={16} />} onClick={() => setModal({ mode: 'create' })}>
            Add Product
          </ActionButton>
        )}
        actions={(p) => (
          <ActionButton variant="view" size="sm" icon={<Pencil size={14} />} onClick={() => setModal({ mode: 'edit', product: p })}>
            Edit
          </ActionButton>
        )}
        empty={{ icon: '📦', title: 'No products', message: 'Create your first product.' }}
      />

      {modal && (
        <ProductFormModal
          mode={modal.mode}
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductFormModal({ mode, product, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || 'FINISHED_PRODUCT',
    unit: product?.unit || 'box',
    minStockLevel: product?.minStockLevel ?? 0,
    unitPrice: product?.unitPrice ?? 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, minStockLevel: Number(form.minStockLevel), unitPrice: Number(form.unitPrice) };
      if (mode === 'create') {
        await productService.create(payload);
        toast.success('Product created');
      } else {
        await productService.update(product.id, payload);
        toast.success('Product updated');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? 'Add Product' : `Edit ${product?.name}`}
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button form="prod-form" type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      )}
    >
      <form id="prod-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label-xs block mb-1.5">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-xs block mb-1.5">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="FINISHED_PRODUCT">Finished Product</option>
              <option value="RAW_MATERIAL">Raw Material</option>
            </select>
          </div>
          <div>
            <label className="label-xs block mb-1.5">Unit</label>
            <input className="input" required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-xs block mb-1.5">Minimum Stock Level</label>
            <input type="number" min="0" step="0.01" className="input" required value={form.minStockLevel}
              onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} />
          </div>
          <div>
            <label className="label-xs block mb-1.5">Unit Price (DZD)</label>
            <input type="number" min="0" step="0.01" className="input" required value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
