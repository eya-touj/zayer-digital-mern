import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import '../styles/confirm-modal.css';

export default function ConfirmModal({
  open,
  title,
  message,
  itemName,
  suffix = '',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'warning',
  showCancel = true,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const messageId = useId();
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);
  const callbacks = useRef({ onCancel, onConfirm });
  callbacks.current = { onCancel, onConfirm };

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    (showCancel ? cancelRef.current : confirmRef.current)?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        callbacks.current.onCancel();
      } else if (event.key === 'Tab') {
        const first = cancelRef.current || confirmRef.current;
        const last = confirmRef.current;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open, showCancel]);

  if (!open) return null;
  const Icon = variant === 'danger' ? Trash2 : AlertTriangle;

  return <div
    className="confirm-modal-backdrop"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) callbacks.current.onCancel();
    }}
  >
    <section className={`confirm-modal-card confirm-modal-${variant}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}>
      <div className="confirm-modal-icon" aria-hidden="true"><Icon size={28} strokeWidth={2} /></div>
      <h3 id={titleId}>{title}</h3>
      <p id={messageId}>{message}{itemName && <> « <strong>{itemName}</strong> »</>}{suffix}</p>
      <div className="confirm-modal-actions">
        {showCancel && <button ref={cancelRef} className="confirm-modal-cancel" type="button" onClick={() => callbacks.current.onCancel()}>{cancelLabel}</button>}
        <button ref={confirmRef} className="confirm-modal-confirm" type="button" onClick={() => callbacks.current.onConfirm()}>{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
