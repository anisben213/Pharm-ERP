import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { ROLE_LABEL, roleKey, roleHome } from '../../utils/roles.js';

export default function Topbar({ title, breadcrumb = [] }) {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/login', { replace: true }); }
  };

  const initials = (user?.fullName || user?.email || '?')
    .split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const home = roleHome(user);
  const notifLink = `${home}/notifications`;

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-ink-800 truncate">{title}</h1>
        {breadcrumb.length > 0 && (
          <nav className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            {breadcrumb.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span>{b}</span>
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          to={notifLink}
          className="relative w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-500"
          title="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden sm:block leading-tight text-left">
              <div className="text-sm font-medium text-ink-800">{user?.fullName || user?.email}</div>
              <div className="text-[11px] text-slate-500">{ROLE_LABEL[roleKey(user)]}</div>
            </div>
            <span className="text-slate-400"><ChevronDown size={14} /></span>
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-cardHover overflow-hidden z-50">
              <div className="px-4 py-2.5 text-xs text-slate-500 border-b border-slate-100">
                Signed in as <strong className="text-ink-800">{user?.username}</strong>
              </div>
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                <User size={14} className="text-slate-400" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-danger-50 text-danger cursor-pointer border-t border-slate-100 flex items-center gap-2"
              ><LogOut size={14} /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
