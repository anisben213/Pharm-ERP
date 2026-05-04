import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, ClipboardList, CalendarDays, Tag, BarChart3 } from 'lucide-react';

const menu = [
  { to: '/production_manager',           end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/production_manager/orders',               icon: <ClipboardList size={18} />,   label: 'Manufacturing Orders' },
  { to: '/production_manager/schedule',             icon: <CalendarDays size={18} />,    label: 'Production Schedule' },
  { to: '/production_manager/batches',              icon: <Tag size={18} />,             label: 'Batch Numbers' },
  { to: '/production_manager/reports',              icon: <BarChart3 size={18} />,       label: 'Reports' },
];

const titles = {
  '/production_manager':            'Production Dashboard',
  '/production_manager/orders':     'Manufacturing Orders',
  '/production_manager/orders/:id': 'Order Detail',
  '/production_manager/schedule':   'Production Schedule',
  '/production_manager/batches':    'Batch Numbers',
  '/production_manager/reports':    'Reports',
};

export default function ProductionManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Production Dashboard" />;
}
