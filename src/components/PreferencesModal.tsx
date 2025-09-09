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
      const arr = list ? Array.from(list) : [];
      return arr.filter(
        (el) =>
          el.getAttribute('aria-hidden') !== 'true' &&
          !el.closest('[aria-hidden="true"]') &&
          (el === dialog || el.getClientRects().length > 0)
      );
    };
    const focusFirst = () => {
      const focusables = getFocusables();
      if (focusables.length > 0) focusables[0].focus();
      else dialog?.focus();
    };
    focusFirst();
    const onWinKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W'))) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onWinKey, true);
    return () => {
      window.removeEventListener('keydown', onWinKey, true);
      lastFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      aria-hidden="false"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefs-title"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
          if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) {
            e.preventDefault();
            onClose();
          }
          if (e.key === 'Tab') {
            const dialog = dialogRef.current;
            const list = dialog?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            const focusables = list ? Array.from(list) : [];
            if (focusables.length === 0) return;
            const active = document.activeElement as HTMLElement | null;
            let idx = focusables.findIndex((el) => el === active);
            if (idx === -1) idx = 0;
            e.preventDefault();
            const delta = e.shiftKey ? -1 : 1;
            const next = (idx + delta + focusables.length) % focusables.length;
            focusables[next].focus();
          }
        }}
      >
        <div
          tabIndex={0}
          aria-hidden="true"
          onFocus={() => {
            const dialog = dialogRef.current;
            const list = dialog?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            const arr = list ? Array.from(list) : [];
            arr[arr.length - 1]?.focus();
          }}
        />
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
        <div
          tabIndex={0}
          aria-hidden="true"
          onFocus={() => {
            const dialog = dialogRef.current;
            const first = dialog?.querySelector<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            first?.focus();
          }}
        />
      </div>
    </div>
  );
};
