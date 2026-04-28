import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/stock_manager',          end: true, icon: '📊', label: 'Dashboard' },
  { to: '/stock_manager/products',            icon: '📦', label: 'Products' },
  { to: '/stock_manager/levels',              icon: '📈', label: 'Stock Levels' },
  { to: '/stock_manager/movements',           icon: '🔄', label: 'Stock Movements' },
  { to: '/stock_manager/batches',             icon: '🔍', label: 'Batch Tracking' },
  { to: '/stock_manager/alerts',              icon: '⚠️', label: 'Alerts' },
  { to: '/stock_manager/reports',             icon: '📋', label: 'Reports' },
];

const titles = {
  '/stock_manager':            'Stock Dashboard',
  '/stock_manager/products':   'Products',
  '/stock_manager/levels':     'Stock Levels',
  '/stock_manager/movements':  'Stock Movements',
  '/stock_manager/batches':    'Batch Tracking',
  '/stock_manager/batches/:id':'Batch History',
  '/stock_manager/alerts':     'Stock Alerts',
  '/stock_manager/reports':    'Reports',
};

export default function StockManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Stock Dashboard" />;
}
