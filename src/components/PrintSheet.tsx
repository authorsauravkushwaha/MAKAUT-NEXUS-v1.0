import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';

interface PrintSheetProps {
  /** Whether the paper preview is open. */
  open: boolean;
  onClose: () => void;
  /** Used for the browser tab / PDF file name while printing. */
  label: string;
  children: React.ReactNode;
}

/**
 * A4 paper preview rendered in a portal above the app.
 * "Print / Save as PDF" triggers the browser print dialog with @page A4 rules;
 * only `.sheet` content prints (app UI and the toolbar are hidden via CSS).
 */
export function PrintSheet({ open, onClose, label, children }: PrintSheetProps) {
  const prevTitle = React.useRef<string>('');

  useEffect(() => {
    if (!open) return;
    prevTitle.current = document.title;
    document.title = `MAKAUT NEXUS — ${label}`;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.title = prevTitle.current;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, label, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="print-overlay">
      <div className="print-toolbar no-print">
        <div className="min-w-0">
          <div className="truncate font-display text-[13px] font-semibold text-white">{label}</div>
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-slate-500">A4 preview · print or save as PDF</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="print-btn print-btn--primary" onClick={() => window.print()}>
            <Printer size={13} /> Print / PDF
          </button>
          <button className="print-btn" onClick={onClose}>
            <X size={13} /> Close
          </button>
        </div>
      </div>
      <div className="sheet">{children}</div>
    </div>,
    document.body,
  );
}
