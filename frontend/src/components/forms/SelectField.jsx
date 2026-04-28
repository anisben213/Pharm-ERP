import { useState } from 'react';

export default function SelectField({
  label, name, value, onChange, onBlur,
  options = [], placeholder = 'Select…',
  required, error, hint, className = '',
}) {
  const [touched, setTouched] = useState(false);
  const showError = (touched || error?.show) && error?.message;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-ink-800 mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={(e) => { setTouched(true); onBlur?.(e); }}
        className={`input ${showError ? 'input-error' : ''}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => {
          const val = typeof o === 'object' ? o.value : o;
          const lab = typeof o === 'object' ? o.label : o;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
      {showError
        ? <p className="text-xs text-danger mt-1.5">{error.message}</p>
        : hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}
