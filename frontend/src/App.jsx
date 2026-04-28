import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useToast } from './hooks/useToast.js';
import { setApiHandlers } from './services/api.js';

export default function App() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout, user } = useAuth();

  useEffect(() => {
    setApiHandlers({
      unauthorized: () => {
        if (user) {
          logout().catch(() => {});
          toast.warning('Session expired. Please sign in again.');
        }
        navigate('/login', { replace: true });
      },
      globalError: (msg) => toast.error(msg || 'An unexpected error occurred'),
    });
  }, [navigate, toast, logout, user]);

  return <AppRoutes />;
}
