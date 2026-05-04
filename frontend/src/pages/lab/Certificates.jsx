import PageHeader from '../../components/common/PageHeader.jsx';
import Table, { IconButton } from '../../components/common/Table.jsx';
import Badge from '../../components/common/Badge.jsx';
import { Printer, Award } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { batchService } from '../../services/index.js';

function generateCoA(batch) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Certificate of Analysis — ${batch.batchNumber}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:auto}
    h1{font-size:22px;color:#1e40af}h2{font-size:16px;color:#374151;margin-top:24px}
    .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb}
    .label{color:#6b7280;font-size:14px}.value{font-weight:600;font-size:14px}
    .badge{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:4px;font-size:13px}
    .footer{margin-top:40px;font-size:12px;color:#9ca3af;text-align:center}
    </style></head><body>
    <h1>Certificate of Analysis</h1>
    <h2>Batch Information</h2>
    <div class="row"><span class="label">Batch Number</span><span class="value">${batch.batchNumber}</span></div>
    <div class="row"><span class="label">Product</span><span class="value">${batch.product?.name || batch.productName || '—'}</span></div>
    <div class="row"><span class="label">Status</span><span class="badge">APPROVED</span></div>
    <div class="row"><span class="label">Manufactured</span><span class="value">${batch.manufacturedAt ? new Date(batch.manufacturedAt).toLocaleDateString() : '—'}</span></div>
    <div class="row"><span class="label">Expiry Date</span><span class="value">${batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '—'}</span></div>
    <div class="row"><span class="label">Remaining Qty</span><span class="value">${Number(batch.remainingQty ?? 0).toLocaleString()}</span></div>
    <h2>QC Verdict</h2>
    <div class="row"><span class="label">Result</span><span class="badge">PASSED</span></div>
    <div class="footer">Generated on ${new Date().toLocaleString()} — ERP Pharm</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export default function LabCertificates() {
  const { data, loading } = useFetch(() => batchService.list().then((r) => r.batches), []);
  // APPROVED batches are the validated ones ready for a certificate
  const validated = (data || []).filter((b) => b.status === 'APPROVED' || b.status === 'RELEASED');
  return (
    <div>
      <PageHeader title="Analysis Certificates" subtitle="Certificates for approved batches." />
      <Table
        loading={loading}
        data={validated}
        searchKeys={['batchNumber', 'productName']}
        filters={[{ key: 'status', label: 'All', options: [
          { value: 'APPROVED', label: 'Approved' },
          { value: 'RELEASED', label: 'Released' },
        ]}]}
        columns={[
          { key: 'batchNumber',   header: 'Batch #',      render: (r) => <span className="font-mono text-primary">{r.batchNumber}</span> },
          { key: 'productName',   header: 'Product',      render: (r) => r.productName || r.product?.name },
          { key: 'manufacturedAt',header: 'Manufactured', sortable: true, render: (r) => r.manufacturedAt ? new Date(r.manufacturedAt).toLocaleDateString() : '—' },
          { key: 'expiryDate',    header: 'Expires',      sortable: true, render: (r) => r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—' },
          { key: 'status',        header: 'Status',       render: (r) => <Badge status={r.status} /> },
        ]}
        actions={(r) => <IconButton icon={<Printer size={15} />} title="Generate / Print CoA" color="primary" onClick={() => generateCoA(r)} />}
        empty={{ icon: <Award size={40} />, title: 'No approved batches', message: 'Approved batches will appear here for certificate generation.' }}
      />
    </div>
  );
}

