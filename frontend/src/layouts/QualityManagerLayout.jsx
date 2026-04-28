import RoleLayout from './RoleLayout.jsx';

const menu = [
  { to: '/quality_manager',                 end: true, icon: '📊', label: 'Dashboard' },
  { to: '/quality_manager/control-files',              icon: '📁', label: 'Control Files' },
  { to: '/quality_manager/validation',                 icon: '✅', label: 'Batch Validation' },
  { to: '/quality_manager/non-conformities',           icon: '❌', label: 'Non-Conformities' },
  { to: '/quality_manager/recalls',                    icon: '🚨', label: 'Batch Recalls' },
  { to: '/quality_manager/history',                    icon: '📜', label: 'Quality History' },
  { to: '/quality_manager/certificates',               icon: '📄', label: 'Certificates' },
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
