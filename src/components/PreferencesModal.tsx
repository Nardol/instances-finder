import React, { useEffect, useRef } from 'react';
import type { Lang } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  expert: boolean;
  onToggleExpert: (v: boolean) => void;
};

export const PreferencesModal: React.FC<Props> = ({ open, onClose, lang, onChangeLang, expert, onToggleExpert }) => {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = (document.activeElement as HTMLElement) || null;

    const dialog = dialogRef.current;
    const getFocusables = () => {
      const list = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return list ? Array.from(list).filter((el) => el.offsetParent !== null || el === dialog) : [];
    };
    const focusFirst = () => {
      const focusables = getFocusables();
      if (focusables.length > 0) focusables[0].focus();
      else dialog?.focus();
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
        const focusables = getFocusables();
        if (focusables.length === 0) return;
        const active = document.activeElement as HTMLElement | null;
        let idx = focusables.findIndex((el) => el === active);
        if (idx === -1) idx = 0;
        e.preventDefault();
        const delta = e.shiftKey ? -1 : 1;
        const next = (idx + delta + focusables.length) % focusables.length;
        focusables[next].focus();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!dialog?.contains(target)) {
        // Redirect stray focus back into the dialog
        e.stopPropagation();
        focusFirst();
      }
    };
    const onClickBackdrop = (e: MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn, true);
    backdropRef.current?.addEventListener('mousedown', onClickBackdrop);
    focusFirst();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn, true);
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
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="prefs-title">Préférences</h2>
          <button type="button" onClick={onClose} aria-label="Fermer les préférences">
            ✕
          </button>
        </header>
        <div className="modal-body" tabIndex={0} role="document">
          <section aria-labelledby="prefs-general-title" style={{ marginBottom: '1rem' }}>
            <h3 id="prefs-general-title">Général</h3>
            <div className="row">
              <label className="label" htmlFor="prefs-lang">Langue de l’interface</label>
              <select id="prefs-lang" value={lang} onChange={(e) => onChangeLang(e.target.value as Lang)}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="row" style={{ marginTop: '.5rem' }}>
              <label>
                <input type="checkbox" checked={expert} onChange={(e) => onToggleExpert(e.target.checked)} /> Mode expert (expérimental)
              </label>
            </div>
          </section>
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
