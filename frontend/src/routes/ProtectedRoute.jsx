import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { roleKey } from '../utils/roles.js';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0) {
    const k = roleKey(user);
    if (!roles.includes(k)) return <Navigate to="/login" replace />;
  }
  return children;
}
