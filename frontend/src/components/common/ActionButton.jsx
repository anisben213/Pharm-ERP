// Color-coded action button per ERP design spec.
// Usage: <ActionButton variant="validate" icon={<Check/>} onClick={...}>Validate</ActionButton>
import { forwardRef } from 'react';

const VARIANTS = {
  view: 'border-2 border-primary text-primary bg-white hover:bg-primary hover:text-white',
  validate: 'bg-success text-white hover:bg-success-700',
  reject: 'bg-danger text-white hover:bg-danger-700',
  close: 'bg-warning text-white hover:bg-warning-700',
  confirm: 'bg-primary text-white hover:bg-primary-700',
  block: 'bg-slate-500 text-white hover:bg-slate-600',
  ship: 'bg-purple-600 text-white hover:bg-purple-700',
  deliver: 'bg-success text-white hover:bg-success-700',
  receive: 'bg-success text-white hover:bg-success-700',
  primary: 'bg-primary text-white hover:bg-primary-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-danger text-white hover:bg-danger-700',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const ActionButton = forwardRef(function ActionButton(
  { variant = 'primary', size = 'md', icon, children, className = '', disabled, ...rest },
  ref
) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] active:scale-100 select-none whitespace-nowrap';
  const variantCls = VARIANTS[variant] || VARIANTS.primary;
  const sizeCls = SIZES[size] || SIZES.md;
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : '';
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`${base} ${sizeCls} ${variantCls} ${disabledCls} ${className}`}
      {...rest}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
});

export default ActionButton;
