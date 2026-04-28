export default function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
      <div className="flex gap-2">{actions}{children}</div>
    </div>
  );
}
