export default function EmptyState({
  icon = '📭',
  title = 'No data yet',
  message = 'There is nothing to display.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-primary-50 text-4xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-5">{message}</p>
      {action}
    </div>
  );
}
