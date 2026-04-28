import Modal from '../common/Modal.jsx';

/**
 * FormModal — wraps a <form> inside a Modal with standard footer buttons.
 *
 * Props:
 *  - open, onClose
 *  - title
 *  - onSubmit(event) — must call e.preventDefault internally if needed
 *  - submitLabel (default "Save")
 *  - cancelLabel (default "Cancel")
 *  - loading
 *  - destructive — uses red Confirm button
 *  - children — form fields
 */
export default function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  destructive = false,
  size = 'md',
  disabled = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || disabled) return;
    onSubmit?.(e);
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size={size}
      footer={(
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>{cancelLabel}</button>
          <button
            type="submit"
            form="form-modal-form"
            className={destructive ? 'btn-danger' : 'btn-primary'}
            disabled={loading || disabled}
          >
            {loading
              ? <span className="inline-flex items-center gap-2"><Spinner /> Working…</span>
              : submitLabel}
          </button>
        </>
      )}
    >
      <form id="form-modal-form" onSubmit={handleSubmit} noValidate>
        {children}
      </form>
    </Modal>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
  );
}
