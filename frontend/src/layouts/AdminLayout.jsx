import { LayoutDashboard, Users as UsersIcon, Package } from 'lucide-react';
import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/users', label: 'Users', icon: <UsersIcon size={18} /> },
  { to: '/admin/products', label: 'Products', icon: <Package size={18} /> },
];

const titles = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/products': 'Products',
  '/admin/notifications': 'Notifications',
};

export default function AdminLayout() {
  return <RoleLayout menu={menu} titles={titles} />;
}
