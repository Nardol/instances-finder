import React, { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const PreferencesModal: React.FC<Props> = ({ open, onClose }) => {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = (document.activeElement as HTMLElement) || null;

    const dialog = dialogRef.current;
    const focusFirst = () => {
      const body = dialog?.querySelector<HTMLElement>('.modal-body');
      if (body) {
        body.focus();
        return;
      }
      const focusables = dialog?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusables?.[0]?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Close on Ctrl/Cmd+W (desktop convention)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        const focusables = dialog?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !dialog?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    const onClickBackdrop = (e: MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    };
    document.addEventListener('keydown', onKey, true);
    backdropRef.current?.addEventListener('mousedown', onClickBackdrop);
    focusFirst();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      backdropRef.current?.removeEventListener('mousedown', onClickBackdrop);
      lastFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={backdropRef} className="modal-backdrop" aria-hidden="false">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefs-title"
      >
        <header className="modal-header">
          <h2 id="prefs-title">Préférences</h2>
          <button type="button" onClick={onClose} aria-label="Fermer les préférences">
            ✕
          </button>
        </header>
        <div className="modal-body" tabIndex={0} role="document">
          <section aria-labelledby="prefs-shortcuts-title">
            <h3 id="prefs-shortcuts-title">Raccourcis clavier</h3>
            <ul>
              <li>Entrée: ouvrir l’instance</li>
              <li>Tab: copier l’URL</li>
              <li>Ctrl/Cmd+Maj+C: copier l’URL</li>
              <li>Ctrl/Cmd+R: actualiser la liste</li>
              <li>Ctrl/Cmd+,: ouvrir les préférences</li>
              <li>Échap ou Ctrl/Cmd+W: fermer les préférences</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
