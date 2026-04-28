import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let nextId = 1;

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const STYLES = {
  success: 'bg-success text-white',
  error:   'bg-danger text-white',
  warning: 'bg-warning text-white',
  info:    'bg-primary text-white',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = nextId++;
    const ttl = opts.ttl ?? (type === 'success' ? 3000 : 4000);
    setToasts((t) => [...t, { id, type, message }]);
    if (ttl > 0) setTimeout(() => remove(id), ttl);
    return id;
  }, [remove]);

  const api = {
    success: (m, o) => push('success', m, o),
    error:   (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o),
    info:    (m, o) => push('info', m, o),
    remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 w-[320px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${STYLES[t.type]} flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.2s_ease]`}
          >
            <span className="text-lg leading-none mt-0.5">{ICONS[t.type]}</span>
            <span className="flex-1 text-sm">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="opacity-80 hover:opacity-100 cursor-pointer text-sm"
              aria-label="Close"
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
