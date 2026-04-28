import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/purchase_manager',           end: true, icon: '📊', label: 'Dashboard' },
  { to: '/purchase_manager/requests',             icon: '📝', label: 'Purchase Requests' },
  { to: '/purchase_manager/orders',               icon: '📦', label: 'Purchase Orders' },
  { to: '/purchase_manager/suppliers',            icon: '🏭', label: 'Suppliers' },
  { to: '/purchase_manager/tracking',             icon: '📊', label: 'Order Tracking' },
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
