import PageHeader from '../../components/common/PageHeader.jsx';

const ROLES = [
  { key: 'ADMIN',               label: 'Admin' },
  { key: 'PURCHASER',           label: 'Purchase Manager' },
  { key: 'STOCK_MANAGER',       label: 'Stock Manager' },
  { key: 'PRODUCTION_MANAGER',  label: 'Production Manager' },
  { key: 'QUALITY_CONTROLLER',  label: 'Quality Manager' },
  { key: 'SALES_AGENT',         label: 'Sales Manager' },
];

const PERMISSIONS = [
  { module: 'Users',           perms: { ADMIN: 'Full', PURCHASER: '—', STOCK_MANAGER: '—', PRODUCTION_MANAGER: '—', QUALITY_CONTROLLER: '—', SALES_AGENT: '—' } },
  { module: 'Products',        perms: { ADMIN: 'Full', PURCHASER: 'Read', STOCK_MANAGER: 'Read/Write', PRODUCTION_MANAGER: 'Read', QUALITY_CONTROLLER: 'Read', SALES_AGENT: 'Read' } },
  { module: 'Stock',           perms: { ADMIN: 'Full', PURCHASER: 'Read', STOCK_MANAGER: 'Full', PRODUCTION_MANAGER: 'Read', QUALITY_CONTROLLER: 'Block', SALES_AGENT: 'Read' } },
  { module: 'Production',      perms: { ADMIN: 'Full', PURCHASER: '—', STOCK_MANAGER: '—', PRODUCTION_MANAGER: 'Full', QUALITY_CONTROLLER: 'Read', SALES_AGENT: '—' } },
  { module: 'Quality',         perms: { ADMIN: 'Full', PURCHASER: '—', STOCK_MANAGER: '—', PRODUCTION_MANAGER: 'Read', QUALITY_CONTROLLER: 'Full', SALES_AGENT: '—' } },
  { module: 'Purchases',       perms: { ADMIN: 'Full', PURCHASER: 'Full', STOCK_MANAGER: 'Read', PRODUCTION_MANAGER: '—', QUALITY_CONTROLLER: '—', SALES_AGENT: '—' } },
  { module: 'Sales',           perms: { ADMIN: 'Full', PURCHASER: '—', STOCK_MANAGER: 'Read', PRODUCTION_MANAGER: '—', QUALITY_CONTROLLER: '—', SALES_AGENT: 'Full' } },
  { module: 'Logs',            perms: { ADMIN: 'Full', PURCHASER: '—', STOCK_MANAGER: '—', PRODUCTION_MANAGER: '—', QUALITY_CONTROLLER: '—', SALES_AGENT: '—' } },
];

function cellColor(v) {
  if (v === 'Full') return 'bg-success-50 text-success-700';
  if (v === 'Read/Write') return 'bg-primary-50 text-primary-700';
  if (v === 'Read') return 'bg-slate-100 text-slate-700';
  if (v === 'Block') return 'bg-warning-50 text-warning';
  return 'text-slate-300';
}

export default function Roles() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Static role-permission matrix." />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="label-xs text-left pb-3 pr-4">Module</th>
              {ROLES.map((r) => <th key={r.key} className="label-xs text-center pb-3 px-2">{r.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.module} className="border-t border-slate-100">
                <td className="py-3 pr-4 font-medium text-ink-800">{p.module}</td>
                {ROLES.map((r) => (
                  <td key={r.key} className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor(p.perms[r.key])}`}>
                      {p.perms[r.key]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
