import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/lab_technician',                  end: true, icon: '📊', label: 'Dashboard' },
  { to: '/lab_technician/control-files',               icon: '📁', label: 'My Control Files' },
  { to: '/lab_technician/results',                     icon: '🔬', label: 'Enter Results' },
  { to: '/lab_technician/certificates',                icon: '📄', label: 'Certificates' },
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
