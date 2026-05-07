import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roleKey, roleHome } from '../utils/roles.js';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  const k = roleKey(user);
  if (roles && !roles.includes(k)) return <Navigate to={roleHome(user)} replace />;
  return children;
}
