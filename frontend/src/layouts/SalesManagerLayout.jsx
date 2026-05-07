import { LayoutDashboard, BookOpen, Receipt, Truck, Users as UsersIcon, Bell } from 'lucide-react';
import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/sales_manager', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/sales_manager/catalog', label: 'Catalog', icon: <BookOpen size={18} /> },
  { to: '/sales_manager/orders', label: 'Sales Orders', icon: <Receipt size={18} /> },
  { to: '/sales_manager/delivery', label: 'Delivery', icon: <Truck size={18} /> },
  { to: '/sales_manager/clients', label: 'Clients', icon: <UsersIcon size={18} /> },
  { to: '/sales_manager/notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

const titles = {
  '/sales_manager': 'Dashboard',
  '/sales_manager/catalog': 'Product Catalog',
  '/sales_manager/orders': 'Sales Orders',
  '/sales_manager/delivery': 'Delivery Notes',
  '/sales_manager/clients': 'Clients',
  '/sales_manager/notifications': 'Notifications',
};

export default function SalesManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} />;
}
