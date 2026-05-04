import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, Users, Shield, ScrollText, Settings } from 'lucide-react';

const menu = [
  { to: '/admin',          end: true, icon: <LayoutDashboard size={18} />, label: 'Global Dashboard' },
  { to: '/admin/users',               icon: <Users size={18} />,           label: 'Users' },
  { to: '/admin/roles',               icon: <Shield size={18} />,          label: 'Roles & Permissions' },
  { to: '/admin/logs',                icon: <ScrollText size={18} />,      label: 'System Logs' },
  { to: '/admin/settings',            icon: <Settings size={18} />,        label: 'Settings' },
];

const titles = {
  '/admin':          'Global Dashboard',
  '/admin/users':    'Users',
  '/admin/roles':    'Roles & Permissions',
  '/admin/logs':     'System Logs',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Global Dashboard" />;
}
