import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { roleHome } from '../utils/roles.js';
import InputField from '../components/forms/InputField.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={roleHome(user)} replace />;

  const validate = (data = form) => {
    const e = {};
    if (!data.email || data.email.trim().length < 3) {
      e.email = { message: 'Username must be at least 3 characters', show: true };
    }
    if (!data.password || data.password.length < 6) {
      e.password = { message: 'Password must be at least 6 characters', show: true };
    }
    return e;
  };

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const onBlur = (e) => {
    const v = validate({ ...form, [e.target.name]: e.target.value });
    setErrors((er) => ({ ...er, [e.target.name]: v[e.target.name] }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome, ${u.fullName || u.email}`);
      const dest = location.state?.from || roleHome(u);
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) toast.error('Invalid username or password');
      else if (!err?.response) toast.error('No connection. Please check your network.');
      else toast.error('Server error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !form.email || !form.password;

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold mb-3">I</div>
        <h1 className="text-xl font-semibold text-ink-800">Inphamedis ERP</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <InputField
          label="Username"
          name="email"
          icon="👤"
          placeholder="user@inphamedis.com"
          value={form.email}
          onChange={onChange}
          onBlur={onBlur}
          required
          autoComplete="username"
          error={errors.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          icon="🔒"
          placeholder="••••••••"
          value={form.password}
          onChange={onChange}
          onBlur={onBlur}
          required
          autoComplete="current-password"
          error={errors.password}
        />
        <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={disabled}>
          {loading
            ? <span className="inline-flex items-center gap-2"><Spinner /> Signing in…</span>
            : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-6">
        © {new Date().getFullYear()} Inphamedis Pharmaceutical Laboratory
      </p>
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />;
}
