import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABEL, roleKey } from '../../utils/roles.js';

export default function Sidebar({ items = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const rk = roleKey(user);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/login', { replace: true }); }
  };

  const initials = (user?.fullName || user?.email || '?')
    .split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="hidden md:flex md:flex-col bg-ink-800 text-slate-100 w-[260px] shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
          <Pill size={20} />
        </div>
        <div className="leading-tight">
          <div className="font-semibold">PharmaLab</div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">ERP System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => [
              'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer relative',
              isActive
                ? 'bg-primary text-white font-medium border-l-4 border-primary-700 pl-2'
                : 'text-slate-300 hover:bg-ink-700 hover:text-white',
            ].join(' ')}
          >
            <span className="flex items-center justify-center w-5 h-5 shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge != null && Number(item.badge) > 0 && (
              <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-700 transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.fullName || user?.email}</div>
            <div className="text-[11px] text-slate-400 truncate">{ROLE_LABEL[rk] || rk}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-slate-300 hover:text-danger cursor-pointer p-1.5 rounded-md transition-colors"
          ><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}
