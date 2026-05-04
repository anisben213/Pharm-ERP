import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, BookOpen, ShoppingBag, Truck, Receipt, RotateCcw, Users } from 'lucide-react';

const menu = [
  { to: '/sales_manager',           end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/sales_manager/catalog',              icon: <BookOpen size={18} />,        label: 'Product Catalog' },
  { to: '/sales_manager/orders',               icon: <ShoppingBag size={18} />,     label: 'Sales Orders' },
  { to: '/sales_manager/deliveries',           icon: <Truck size={18} />,           label: 'Delivery Notes' },
  { to: '/sales_manager/invoices',             icon: <Receipt size={18} />,         label: 'Invoices' },
  { to: '/sales_manager/returns',              icon: <RotateCcw size={18} />,       label: 'Returns' },
  { to: '/sales_manager/clients',              icon: <Users size={18} />,           label: 'Clients' },
];

const titles = {
  '/sales_manager':            'Sales Dashboard',
  '/sales_manager/catalog':    'Product Catalog',
  '/sales_manager/orders':     'Sales Orders',
  '/sales_manager/orders/:id': 'Order Detail',
  '/sales_manager/deliveries': 'Delivery Notes',
  '/sales_manager/invoices':   'Invoices',
  '/sales_manager/returns':    'Returns',
  '/sales_manager/clients':    'Clients',
};

export default function SalesManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Sales Dashboard" />;
}
