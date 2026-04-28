import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1E293B 0%, #2563EB 100%)' }}
    >
      <Outlet />
    </div>
  );
}
