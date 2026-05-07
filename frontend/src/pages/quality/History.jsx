import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Printer } from 'lucide-react';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ActionButton from '../../components/common/ActionButton.jsx';
import { qualityControlService } from '../../services/index.js';

function printCertificate(cert) {
  const resultColor = cert.result === 'VALIDATED' ? '#059669' : '#dc2626';
  const resultBg    = cert.result === 'VALIDATED' ? '#d1fae5' : '#fee2e2';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Quality Certificate — ${cert.batch?.batchNumber || cert.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;padding:48px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:28px}
    .logo{font-size:22px;font-weight:700;color:#1d4ed8;letter-spacing:-0.5px}
    .logo span{color:#64748b;font-weight:400;font-size:13px;display:block;margin-top:2px}
    .cert-title{text-align:right}
    .cert-title h1{font-size:20px;font-weight:700;color:#1e293b}
    .cert-title p{font-size:12px;color:#64748b;margin-top:4px}
    .badge{display:inline-block;padding:4px 14px;border-radius:999px;font-weight:700;font-size:13px;background:${resultBg};color:${resultColor}}
    table{width:100%;border-collapse:collapse;margin-bottom:28px}
    tr{border-bottom:1px solid #f1f5f9}
    td{padding:10px 0;font-size:14px}
    td:first-child{color:#64748b;width:42%}
    td:last-child{font-weight:600;color:#0f172a}
    .notes-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:13px;color:#334155;line-height:1.6;white-space:pre-wrap;margin-bottom:28px}
    .footer{border-top:1px solid #e2e8f0;padding-top:16px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
    .sig{margin-top:48px;display:flex;justify-content:flex-end}
    .sig-box{border-top:1px solid #cbd5e1;width:200px;text-align:center;padding-top:8px;font-size:12px;color:#64748b}
    @media print{body{padding:32px}button{display:none}}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PharmaLab ERP<span>Quality Management System</span></div>
    <div class="cert-title">
      <h1>Quality Control Certificate</h1>
      <p>Document No: QC-${String(cert.id).padStart(5,'0')}</p>
    </div>
  </div>
  <table>
    <tr><td>Batch Number</td><td>${cert.batch?.batchNumber || '—'}</td></tr>
    <tr><td>Product</td><td>${cert.batch?.product?.name || '—'}</td></tr>
    <tr><td>Control Date</td><td>${cert.controlDate ? new Date(cert.controlDate).toLocaleString() : '—'}</td></tr>
    <tr><td>Origin</td><td>${cert.origin || '—'}</td></tr>
    <tr><td>Inspector</td><td>${cert.user?.fullName || cert.user?.username || '—'}</td></tr>
    <tr><td>Result</td><td><span class="badge">${cert.result}</span></td></tr>
  </table>
  <div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:8px">Analysis Notes</div>
  <div class="notes-box">${cert.notes || 'No notes recorded.'}</div>
  <div class="sig"><div class="sig-box">Inspector Signature</div></div>
  <div class="footer">
    <span>PharmaLab ERP — Quality Management</span>
    <span>Printed on ${new Date().toLocaleString()}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=820,height=680');
  win.document.write(html);
  win.document.close();
  win.focus();
  // slight delay to ensure styles are applied before print dialog
  setTimeout(() => { win.print(); }, 300);
}

export default function QualityHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);

  useEffect(() => {
    (async () => {
      try { setHistory(await qualityControlService.history()); }
      finally { setLoading(false); }
    })();
  }, []);

  const view = async (qc) => {
    try {
      const data = await qualityControlService.certificate(qc.id);
      setCert(data);
    } catch { setCert({ ...qc, _basic: true }); }
  };

  return (
    <>
      <Table
        columns={[
          {
            key: 'batchNumber', header: 'Batch', sortable: true,
            accessor: (h) => h.batch?.batchNumber,
            render: (h) => h.batch?.batchNumber ? (
              <Link to={`/stock_manager/batch-tracking/${encodeURIComponent(h.batch.batchNumber)}`}
                className="text-primary hover:underline">{h.batch.batchNumber}</Link>
            ) : '—',
          },
          { key: 'product', header: 'Product', accessor: (h) => h.batch?.product?.name },
          {
            key: 'controlDate', header: 'Date', sortable: true,
            accessor: (h) => h.controlDate,
            render: (h) => h.controlDate ? new Date(h.controlDate).toLocaleString() : '—',
          },
          { key: 'result', header: 'Result', render: (h) => <StatusBadge status={h.result} /> },
          { key: 'origin', header: 'Origin', render: (h) => <StatusBadge status={h.origin} /> },
          {
            key: 'notes', header: 'Notes',
            render: (h) => (
              <span className="text-sm text-slate-600 truncate max-w-[260px] inline-block align-middle">
                {h.notes || '—'}
              </span>
            ),
          },
        ]}
        data={history}
        loading={loading}
        searchKeys={['notes']}
        filters={[{
          key: 'result',
          label: 'All results',
          options: [
            { value: 'VALIDATED', label: 'Validated' },
            { value: 'REJECTED', label: 'Rejected' },
          ],
        }]}
        actions={(h) => h.result === 'VALIDATED' ? (
          <ActionButton variant="view" size="sm" icon={<FileText size={14} />} onClick={() => view(h)}>
            Certificate
          </ActionButton>
        ) : null}
        empty={{ icon: '📚', title: 'No history', message: 'Validated and rejected controls will appear here.' }}
      />

      {cert && (
        <Modal open onClose={() => setCert(null)} title="Quality Certificate"
          footer={(
            <div className="flex items-center justify-between w-full gap-2">
              <ActionButton variant="view" icon={<Printer size={15} />} onClick={() => printCertificate(cert)}>
                Print / Download PDF
              </ActionButton>
              <button className="btn-ghost" onClick={() => setCert(null)}>Close</button>
            </div>
          )}>
          <div className="space-y-3 text-sm">
            <Row label="Batch Number" value={cert.batch?.batchNumber} />
            <Row label="Product" value={cert.batch?.product?.name} />
            <Row label="Result" value={<StatusBadge status={cert.result} />} />
            <Row label="Origin" value={cert.origin} />
            <Row label="Date" value={cert.controlDate ? new Date(cert.controlDate).toLocaleString() : '—'} />
            <Row label="Inspector" value={cert.user?.fullName || cert.user?.username || '—'} />
            <div>
              <div className="label-xs mb-1">Notes</div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 whitespace-pre-wrap">
                {cert.notes || '—'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-ink-800 text-right">{value || '—'}</span>
    </div>
  );
}
