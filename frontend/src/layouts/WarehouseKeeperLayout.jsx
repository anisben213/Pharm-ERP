import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, ArrowLeftRight, Warehouse, ScrollText } from 'lucide-react';

const menu = [
  { to: '/warehouse_keeper',           end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/warehouse_keeper/record',               icon: <ArrowLeftRight size={18} />,  label: 'Record Movement' },
  { to: '/warehouse_keeper/locations',            icon: <Warehouse size={18} />,       label: 'Storage Locations' },
  { to: '/warehouse_keeper/movements',            icon: <ScrollText size={18} />,      label: 'My Movements' },
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
