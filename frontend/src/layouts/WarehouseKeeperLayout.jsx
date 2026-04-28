import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/warehouse_keeper',           end: true, icon: '📊', label: 'Dashboard' },
  { to: '/warehouse_keeper/record',               icon: '🔄', label: 'Record Movement' },
  { to: '/warehouse_keeper/locations',            icon: '📍', label: 'Storage Locations' },
  { to: '/warehouse_keeper/movements',            icon: '📜', label: 'My Movements' },
];

const titles = {
  '/warehouse_keeper':            'My Dashboard',
  '/warehouse_keeper/record':     'Record Movement',
  '/warehouse_keeper/locations':  'Storage Locations',
  '/warehouse_keeper/movements':  'My Movements',
};

export default function WarehouseKeeperLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="My Dashboard" />;
}
