import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Pill, Mail, Lock, BarChart3, Tag, Package, ShieldCheck, CheckCircle, FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { roleHome } from '../utils/roles.js';
import InputField from '../components/forms/InputField.jsx';

const FEATURES = [
  { icon: <BarChart3 size={16} />,   text: 'Real-Time Production Monitoring' },
  { icon: <Tag size={16} />,         text: 'Full Batch & Lot Traceability'    },
  { icon: <Package size={16} />,     text: 'Automated Stock Management'       },
  { icon: <ShieldCheck size={16} />, text: 'GMP-Ready Quality Control'        },
  { icon: <CheckCircle size={16} />, text: 'Multi-Role Access Control'        },
];

/* SVG lab-themed background pattern rendered inline so no image file is needed */
function LabPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.07 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="lab-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="1.5" fill="white" />
          <line x1="0" y1="30" x2="60" y2="30" stroke="white" strokeWidth="0.4" />
          <line x1="30" y1="0" x2="30" y2="60" stroke="white" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lab-grid)" />

      {/* Decorative molecules / lab shapes */}
      {/* Hexagon (benzene-like ring) */}
      <polygon points="120,80 148,65 176,80 176,110 148,125 120,110"
        fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="148" cy="65"  r="4" fill="white" fillOpacity="0.4" />
      <circle cx="176" cy="80"  r="4" fill="white" fillOpacity="0.4" />
      <circle cx="176" cy="110" r="4" fill="white" fillOpacity="0.4" />
      <circle cx="148" cy="125" r="4" fill="white" fillOpacity="0.4" />
      <circle cx="120" cy="110" r="4" fill="white" fillOpacity="0.4" />
      <circle cx="120" cy="80"  r="4" fill="white" fillOpacity="0.4" />

      {/* DNA helix suggestion */}
      <path d="M60,200 Q90,220 60,240 Q30,260 60,280 Q90,300 60,320" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M90,200 Q60,220 90,240 Q120,260 90,280 Q60,300 90,320" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="60" y1="200" x2="90" y2="200" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="68" y1="220" x2="82" y2="220" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="60" y1="240" x2="90" y2="240" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="68" y1="260" x2="82" y2="260" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="60" y1="280" x2="90" y2="280" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="68" y1="300" x2="82" y2="300" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="60" y1="320" x2="90" y2="320" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

      {/* Flask outline bottom-right area */}
      <path d="M340,360 L320,420 Q310,450 340,460 Q370,450 360,420 Z"
        fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
      <line x1="335" y1="360" x2="345" y2="360" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
      <line x1="332" y1="354" x2="348" y2="354" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
      <circle cx="325" cy="435" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="345" cy="445" r="2" fill="white" fillOpacity="0.3" />

      {/* Atom / orbit */}
      <ellipse cx="300" cy="130" rx="45" ry="18" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" transform="rotate(30 300 130)" />
      <ellipse cx="300" cy="130" rx="45" ry="18" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" transform="rotate(90 300 130)" />
      <ellipse cx="300" cy="130" rx="45" ry="18" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" transform="rotate(150 300 130)" />
      <circle cx="300" cy="130" r="6" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

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
    if (!data.email || data.email.trim().length < 3)
      e.email = { message: 'Username must be at least 3 characters', show: true };
    if (!data.password || data.password.length < 6)
      e.password = { message: 'Password must be at least 6 characters', show: true };
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
    <div className="min-h-screen flex overflow-hidden bg-[#F0F4FF]">

      {/* ── Left branded panel ── */}
      <div
        className="hidden lg:flex flex-col justify-center w-[56%] shrink-0 px-16 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #0f2a6e 0%, #1d4ed8 55%, #3b82f6 100%)',
          clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)',
          paddingRight: '12%',
        }}
      >
        {/* Lab pattern overlay */}
        <LabPattern />

        {/* Glowing blobs */}
        <div className="absolute top-[-80px] right-[60px] w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] left-[80px] w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.2) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <FlaskConical size={24} />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-2xl tracking-tight">PharmaLab</div>
              <div className="text-blue-200 text-[11px] uppercase tracking-[0.15em]">Pharmaceutical ERP</div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-[2.8rem] font-extrabold leading-[1.1] mb-5">
            Precision<br />
            <span className="text-blue-200">at every</span><br />
            stage.
          </h1>
          <p className="text-blue-100 text-[0.93rem] leading-relaxed mb-10 max-w-[320px]">
            An integrated ERP platform built for pharmaceutical laboratories —
            from raw material intake to final delivery.
          </p>

          {/* Feature pills */}
          <ul className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-sm">
                  {f.icon}
                </span>
                <span className="text-sm font-medium text-blue-50">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Trust badges */}
          <div className="flex items-center gap-4 mt-12">
            {['GMP'].map((b) => (
              <span key={b} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/10 border border-white/20">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-5 left-16 text-blue-400/50 text-[11px] z-10">
          © {new Date().getFullYear()} PharmaLab. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-[#F0F4FF] relative">
        {/* Subtle background circle */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(219,234,254,0.7) 0%, transparent 70%)' }} />

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
            <FlaskConical size={20} />
          </div>
          <span className="font-bold text-ink-800 text-lg">PharmaLab ERP</span>
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-blue-100/60 border border-blue-100 px-8 py-10">
          {/* Header */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-ink-800 mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your PharmaLab account.</p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <InputField
              label="Username / Email"
              name="email"
              icon={<Mail size={16} />}
              placeholder="you@pharmalab.com"
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
              icon={<Lock size={16} />}
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              required
              autoComplete="current-password"
              error={errors.password}
            />
            <button
              type="submit"
              className="btn-primary w-full justify-center mt-3 py-2.5 text-sm font-semibold rounded-xl"
              disabled={disabled}
            >
              {loading
                ? <span className="inline-flex items-center gap-2"><Spinner /> Signing in…</span>
                : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-7">
            © {new Date().getFullYear()} PharmaLab Pharmaceutical Laboratory
          </p>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />;
}
