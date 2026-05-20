import { useEffect, useState, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 固定在底部、不参与滚动的操作区。通常放 .sheet-actions。 */
  footer?: ReactNode;
  modalId?: string;
}

export function Sheet({ open, onClose, children, footer, modalId }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else if (mounted) {
      setClosing(true);
      setShown(false);
      const t = window.setTimeout(() => {
        setClosing(false);
        setMounted(false);
      }, 340);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`sheet-modal${shown ? ' shown' : ''}${closing ? ' closing' : ''}`}
      id={modalId}
    >
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet sheet-split" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  );
}
