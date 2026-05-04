import { useEffect, useState } from 'react';
import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, Package, BarChart3, ArrowLeftRight, Search, AlertCircle, FileText, Truck, MapPin } from 'lucide-react';
import { salesService } from '../services/index.js';

const menu = [
  { to: '/stock_manager',                    end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/stock_manager/products',                      icon: <Package size={18} />,         label: 'Products' },
  { to: '/stock_manager/levels',                        icon: <BarChart3 size={18} />,       label: 'Stock Levels' },
  { to: '/stock_manager/locations',                     icon: <MapPin size={18} />,          label: 'Stock Locations' },
  { to: '/stock_manager/movements',                     icon: <ArrowLeftRight size={18} />,  label: 'Stock Movements' },
  { to: '/stock_manager/delivery-notes',                icon: <Truck size={18} />,           label: 'Delivery Notes' },
  { to: '/stock_manager/batches',                       icon: <Search size={18} />,          label: 'Batch Tracking' },
  { to: '/stock_manager/alerts',                        icon: <AlertCircle size={18} />,     label: 'Alerts' },
  { to: '/stock_manager/reports',                       icon: <FileText size={18} />,        label: 'Reports' },
];

const titles = {
  '/stock_manager':                  'Stock Dashboard',
  '/stock_manager/products':         'Products',
  '/stock_manager/levels':           'Stock Levels',
  '/stock_manager/locations':        'Stock Locations',
  '/stock_manager/movements':        'Stock Movements',
  '/stock_manager/delivery-notes':   'Delivery Notes',
  '/stock_manager/batches':          'Batch Tracking',
  '/stock_manager/batches/:id':      'Batch History',
  '/stock_manager/alerts':           'Stock Alerts',
  '/stock_manager/reports':          'Reports',
};

export default function StockManagerLayout() {
  const [confirmed, setConfirmed] = useState([]);

  useEffect(() => {
    const load = () => salesService.list().then((r) => {
      setConfirmed((r.orders || []).filter((o) => o.status === 'CONFIRMED'));
    }).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const notificationItems = confirmed.map((o) => ({
    id: o.id,
    title: `Order ${o.reference || o.id}`,
    subtitle: `Client: ${o.customer?.name || '\u2014'} \u00b7 ${new Date(o.createdAt).toLocaleDateString()}`,
    to: '/stock_manager/delivery-notes',
  }));

  return (
    <RoleLayout
      menu={menu}
      titles={titles}
      defaultTitle="Stock Dashboard"
      notifications={confirmed.length}
      notificationItems={notificationItems}
    />
  );
}
