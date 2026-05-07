import { LayoutDashboard, Boxes, ArrowRightLeft, ScanLine, AlertTriangle, Bell } from 'lucide-react';
import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/stock_manager', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/stock_manager/stock', label: 'Stock', icon: <Boxes size={18} /> },
  { to: '/stock_manager/movements', label: 'Movements', icon: <ArrowRightLeft size={18} /> },
  { to: '/stock_manager/batch-tracking', label: 'Batch Tracking', icon: <ScanLine size={18} /> },
  { to: '/stock_manager/alerts', label: 'Alerts', icon: <AlertTriangle size={18} /> },
  { to: '/stock_manager/notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

const titles = {
  '/stock_manager': 'Dashboard',
  '/stock_manager/stock': 'Stock',
  '/stock_manager/movements': 'Stock Movements',
  '/stock_manager/batch-tracking': 'Batch Tracking',
  '/stock_manager/batch-tracking/:batchNumber': 'Batch Trace',
  '/stock_manager/alerts': 'Alerts',
  '/stock_manager/notifications': 'Notifications',
};

export default function StockManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} />;
}
