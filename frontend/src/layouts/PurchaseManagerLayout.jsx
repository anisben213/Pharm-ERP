import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, FileText, ShoppingCart, Building2, Truck } from 'lucide-react';

const menu = [
  { to: '/purchase_manager',           end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/purchase_manager/requests',             icon: <FileText size={18} />,        label: 'Purchase Requests' },
  { to: '/purchase_manager/orders',               icon: <ShoppingCart size={18} />,    label: 'Purchase Orders' },
  { to: '/purchase_manager/suppliers',            icon: <Building2 size={18} />,       label: 'Suppliers' },
  { to: '/purchase_manager/tracking',             icon: <Truck size={18} />,           label: 'Order Tracking' },
];

const titles = {
  '/purchase_manager':           'Purchase Dashboard',
  '/purchase_manager/requests':  'Purchase Requests',
  '/purchase_manager/orders':    'Purchase Orders',
  '/purchase_manager/suppliers': 'Suppliers',
  '/purchase_manager/tracking':  'Order Tracking',
};

export default function PurchaseManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Purchase Dashboard" />;
}
