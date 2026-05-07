import { LayoutDashboard, ShoppingCart, Building2, Bell } from 'lucide-react';
import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/purchase_manager', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/purchase_manager/orders', label: 'Purchase Orders', icon: <ShoppingCart size={18} /> },
  { to: '/purchase_manager/suppliers', label: 'Suppliers', icon: <Building2 size={18} /> },
  { to: '/purchase_manager/notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

const titles = {
  '/purchase_manager': 'Dashboard',
  '/purchase_manager/orders': 'Purchase Orders',
  '/purchase_manager/suppliers': 'Suppliers',
  '/purchase_manager/notifications': 'Notifications',
};

export default function PurchaseManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} />;
}
