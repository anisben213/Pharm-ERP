import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { notificationService } from '../services/index.js';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) { setUnread(0); setItems([]); return; }
    try {
      const data = await notificationService.list();
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (_) { /* ignore */ }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!user) return undefined;
    const id = setInterval(refresh, 45_000);
    return () => clearInterval(id);
  }, [user, refresh]);

  const markRead = async (id) => {
    try { await notificationService.read(id); } finally { refresh(); }
  };
  const markAllRead = async () => {
    try { await notificationService.readAll(); } finally { refresh(); }
  };

  return (
    <NotificationContext.Provider value={{ unread, items, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext);
