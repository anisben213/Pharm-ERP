import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { roleHome, roleKey } from '../utils/roles.js';
import EmptyState from '../components/common/EmptyState.jsx';

const ICONS = {
  INFO: { I: Info, cls: 'bg-primary-50 text-primary-600' },
  SUCCESS: { I: CheckCircle2, cls: 'bg-success-50 text-success-600' },
  WARNING: { I: AlertTriangle, cls: 'bg-warning-50 text-warning-600' },
  ERROR: { I: AlertOctagon, cls: 'bg-danger-50 text-danger-600' },
};

function timeAgo(date) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function targetFor(role, n) {
  const home = {
    admin: '/admin', stock_manager: '/stock_manager', production_manager: '/production_manager',
    purchase_manager: '/purchase_manager', quality_manager: '/quality_manager', sales_manager: '/sales_manager',
  }[role] || '/';
  switch (n.relatedType) {
    case 'batch':
      if (role === 'quality_manager') return `${home}/pending`;
      if (role === 'stock_manager') return `${home}/stock`;
      return `${home}`;
    case 'manufacturing_order':
      return role === 'production_manager' ? `${home}/orders` : home;
    case 'sales_order':
      return role === 'stock_manager' ? `${home}/movements` : home;
    case 'product_low_stock':
      if (role === 'purchase_manager') return `${home}/orders`;
      if (role === 'production_manager') return `${home}/orders`;
      return home;
    default:
      return home;
  }
}

export default function NotificationsPage() {
  const { items, markRead, markAllRead, unread } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = roleKey(user);

  const onClick = async (n) => {
    if (!n.isRead) await markRead(n.id);
    navigate(targetFor(role, n));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-800">Notifications</h2>
          <p className="text-sm text-slate-500">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-primary text-primary hover:bg-primary hover:text-white cursor-pointer transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card">
          <EmptyState icon="🔔" title="No notifications" message="You're all caught up." />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card divide-y divide-slate-100">
          {items.map((n) => {
            const I = (ICONS[n.type] || ICONS.INFO).I;
            const cls = (ICONS[n.type] || ICONS.INFO).cls;
            return (
              <button
                key={n.id}
                onClick={() => onClick(n)}
                className={`w-full text-left flex items-start gap-3 px-5 py-4 transition-all duration-200 ease-out cursor-pointer hover:bg-slate-50 ${n.isRead ? '' : 'bg-primary-50/50'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cls}`}>
                  <I size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-800">
                    {!n.isRead && <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 align-middle" />}
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <Bell size={14} className="text-primary mt-1 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
