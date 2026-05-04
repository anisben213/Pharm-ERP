import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const InputField = forwardRef(function InputField(
  { label, name, type = 'text', value, onChange, onBlur, placeholder, required, error, hint, icon, className = '', ...rest },
  ref
) {
  const [touched, setTouched] = useState(false);
  const showError = (touched || error?.show) && error?.message;
  const [show, setShow] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-ink-800 mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">{icon}</span>
        )}
        <input
          ref={ref}
          name={name}
          type={inputType}
          value={value ?? ''}
          onChange={onChange}
          onBlur={(e) => { setTouched(true); onBlur?.(e); }}
          placeholder={placeholder}
          className={[
            'input',
            icon ? 'pl-9' : '',
            isPassword ? 'pr-10' : '',
            showError ? 'input-error' : '',
          ].join(' ')}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink-800 cursor-pointer text-sm"
            tabIndex={-1}
          >{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        )}
      </div>
      {showError
        ? <p className="text-xs text-danger mt-1.5">{error.message}</p>
        : hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
});

export default InputField;
