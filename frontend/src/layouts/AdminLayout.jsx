import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/admin',          end: true, icon: '📊', label: 'Global Dashboard' },
  { to: '/admin/users',               icon: '👥', label: 'Users' },
  { to: '/admin/roles',               icon: '🔐', label: 'Roles & Permissions' },
  { to: '/admin/logs',                icon: '📋', label: 'System Logs' },
  { to: '/admin/settings',            icon: '⚙️', label: 'Settings' },
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
