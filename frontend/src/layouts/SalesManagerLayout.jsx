import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/sales_manager',           end: true, icon: '📊', label: 'Dashboard' },
  { to: '/sales_manager/catalog',              icon: '📖', label: 'Product Catalog' },
  { to: '/sales_manager/orders',               icon: '🛒', label: 'Sales Orders' },
  { to: '/sales_manager/deliveries',           icon: '🚚', label: 'Delivery Notes' },
  { to: '/sales_manager/invoices',             icon: '💰', label: 'Invoices' },
  { to: '/sales_manager/returns',              icon: '↩️', label: 'Returns' },
  { to: '/sales_manager/clients',              icon: '👥', label: 'Clients' },
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
