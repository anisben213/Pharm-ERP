import RoleLayout from './RoleLayout.jsx';
import { LayoutDashboard, FolderOpen, FlaskConical, Award } from 'lucide-react';

const menu = [
  { to: '/lab_technician',                  end: true, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/lab_technician/control-files',               icon: <FolderOpen size={18} />,      label: 'My Control Files' },
  { to: '/lab_technician/results',                     icon: <FlaskConical size={18} />,    label: 'Enter Results' },
  { to: '/lab_technician/certificates',                icon: <Award size={18} />,           label: 'Certificates' },
];

const titles = {
  '/lab_technician':                'Lab Dashboard',
  '/lab_technician/control-files':  'My Control Files',
  '/lab_technician/results':        'Enter Results',
  '/lab_technician/certificates':   'Certificates',
};

export default function LabTechnicianLayout() {
  return <RoleLayout menu={menu} titles={titles} defaultTitle="Lab Dashboard" />;
}
