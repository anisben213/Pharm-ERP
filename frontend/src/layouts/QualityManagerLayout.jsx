import { LayoutDashboard, ClipboardCheck, History, Bell } from 'lucide-react';
import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/quality_manager', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/quality_manager/pending', label: 'Pending Analysis', icon: <ClipboardCheck size={18} /> },
  { to: '/quality_manager/history', label: 'History', icon: <History size={18} /> },
  { to: '/quality_manager/notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

const titles = {
  '/quality_manager': 'Dashboard',
  '/quality_manager/pending': 'Pending Analysis',
  '/quality_manager/history': 'Quality History',
  '/quality_manager/notifications': 'Notifications',
};

export default function QualityManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} />;
}
