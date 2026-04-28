import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', roles: null },
  { to: '/batches', label: 'Batches', roles: null },
  { to: '/stock', label: 'Stock', roles: ['ADMIN', 'STOCK_MANAGER', 'PRODUCTION_MANAGER', 'PURCHASER', 'SALES_AGENT', 'QUALITY_CONTROLLER'] },
  { to: '/purchases', label: 'Purchases', roles: ['ADMIN', 'PURCHASER', 'STOCK_MANAGER'] },
  { to: '/production', label: 'Production', roles: ['ADMIN', 'PRODUCTION_MANAGER'] },
  { to: '/quality', label: 'Quality', roles: ['ADMIN', 'QUALITY_CONTROLLER', 'PRODUCTION_MANAGER'] },
  { to: '/sales', label: 'Sales', roles: ['ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'] },
  { to: '/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/logs', label: 'Audit Logs', roles: ['ADMIN'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const links = NAV.filter((l) => !l.roles || l.roles.includes(user?.role));

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 text-xl font-bold border-b border-slate-700">ERP Pharm</div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${
                  isActive ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm">
          <div className="mb-2">
            <div className="font-medium">{user?.fullName || user?.email}</div>
            <div className="text-slate-400 text-xs">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
