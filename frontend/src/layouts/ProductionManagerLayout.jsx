import { LayoutDashboard, Factory, Calendar, Bell } from 'lucide-react';
import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/production_manager', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/production_manager/orders', label: 'Manufacturing Orders', icon: <Factory size={18} /> },
  { to: '/production_manager/schedule', label: 'Schedule', icon: <Calendar size={18} /> },
  { to: '/production_manager/notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

const titles = {
  '/production_manager': 'Dashboard',
  '/production_manager/orders': 'Manufacturing Orders',
  '/production_manager/schedule': 'Production Schedule',
  '/production_manager/notifications': 'Notifications',
};

export default function ProductionManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} />;
}
