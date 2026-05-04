import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, FolderOpen, CheckSquare, AlertTriangle, AlertOctagon, History, Award } from 'lucide-react';

const menu = [
  { to: '/quality_manager',                 end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/quality_manager/control-files',              icon: <FolderOpen size={18} />,      label: 'Control Files' },
  { to: '/quality_manager/validation',                 icon: <CheckSquare size={18} />,     label: 'Batch Validation' },
  { to: '/quality_manager/non-conformities',           icon: <AlertTriangle size={18} />,   label: 'Non-Conformities' },
  { to: '/quality_manager/recalls',                    icon: <AlertOctagon size={18} />,    label: 'Batch Recalls' },
  { to: '/quality_manager/history',                    icon: <History size={18} />,         label: 'Quality History' },
  { to: '/quality_manager/certificates',               icon: <Award size={18} />,           label: 'Certificates' },
];

const titles = {
  '/quality_manager':                  'Quality Dashboard',
  '/quality_manager/control-files':    'Control Files',
  '/quality_manager/validation':       'Batch Validation',
  '/quality_manager/non-conformities': 'Non-Conformities',
  '/quality_manager/recalls':          'Batch Recalls',
  '/quality_manager/history':          'Quality History',
  '/quality_manager/certificates':     'Certificates',
};

export default function QualityManagerLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Quality Dashboard" />;
}
