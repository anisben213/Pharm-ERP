import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import Topbar from '../components/common/Topbar.jsx';

/**
 * Shared role-aware layout. Each role-specific layout file just passes
 * its own menu items + page-title map.
 *
 * Props:
 *  - menu: [{ to, label, icon, end?, badge? }]
 *  - titles: { [pathPattern]: 'Page Title' }   used to drive Topbar title.
 */
export default function RoleLayout({ menu = [], titles = {}, defaultTitle = 'Dashboard' }) {
  const location = useLocation();

  // Resolve title from titles map (supports patterns like "/stock/batches/:id").
  let title = defaultTitle;
  let breadcrumb = [];
  for (const [pattern, t] of Object.entries(titles)) {
    if (matchPath({ path: pattern, end: true }, location.pathname)) {
      title = t;
      const segs = location.pathname.split('/').filter(Boolean);
      breadcrumb = segs.map((s) => s.replace(/-/g, ' '));
      break;
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar items={menu} />
      <main className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} breadcrumb={breadcrumb} />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
