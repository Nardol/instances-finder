import React, { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import type { Lang } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  expert: boolean;
  onToggleExpert: (v: boolean) => void;
  brailleRefresh: boolean;
  onToggleBrailleRefresh: (v: boolean) => void;
};

export const PreferencesModal: React.FC<Props> = ({
  open,
  onClose,
  lang,
  onChangeLang,
  expert,
  onToggleExpert,
  brailleRefresh,
  onToggleBrailleRefresh,
}) => {
  const { t } = useI18n();
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
          !el.hasAttribute('data-sentinel') &&
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
        return;
      }
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog || !dialog.contains(document.activeElement)) return;
        const list = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const focusables = Array.from(list || []);
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
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (open && dialog && !dialog.contains(e.target as Node)) {
        // keep focus trapped in dialog for Orca/WebKitGTK
        e.stopPropagation();
        focusFirst();
      }
    };
    window.addEventListener('keydown', onWinKey, true);
    window.addEventListener('focusin', onFocusIn, true);
    return () => {
      window.removeEventListener('keydown', onWinKey, true);
      window.removeEventListener('focusin', onFocusIn, true);
      lastFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      aria-hidden="false"
      role="button"
      tabIndex={-1}
      aria-label={t('prefs.close')}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (
          e.target === backdropRef.current &&
          (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')
        ) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefs-title"
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="prefs-title">{t('prefs.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('prefs.close')}>
            ✕
          </button>
        </header>
        <div className="modal-body" role="document">
          <section aria-labelledby="prefs-general-title" style={{ marginBottom: '1rem' }}>
            <h3 id="prefs-general-title">{t('prefs.general')}</h3>
            <div className="row">
              <label className="label" htmlFor="prefs-lang">
                {t('prefs.ui_language')}
              </label>
              <select
                id="prefs-lang"
                value={lang}
                onChange={(e) => onChangeLang(e.target.value as Lang)}
              >
                <option value="fr">{t('header.fr')}</option>
                <option value="en">{t('header.en')}</option>
              </select>
            </div>
            <div className="row" style={{ marginTop: '.5rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={expert}
                  onChange={(e) => onToggleExpert(e.target.checked)}
                />{' '}
                {t('prefs.expert_mode')}
              </label>
            </div>
          </section>
          <section aria-labelledby="prefs-a11y-title" style={{ marginBottom: '1rem' }}>
            <h3 id="prefs-a11y-title">{t('prefs.accessibility')}</h3>
            <div className="row">
              <label>
                <input
                  type="checkbox"
                  checked={brailleRefresh}
                  onChange={(e) => onToggleBrailleRefresh(e.target.checked)}
                />{' '}
                {t('prefs.braille_refresh')}
              </label>
            </div>
          </section>
          <section aria-labelledby="prefs-shortcuts-title">
            <h3 id="prefs-shortcuts-title">{t('prefs.shortcuts')}</h3>
            <ul>
              <li>{t('prefs.shortcut_enter_open')}</li>
              <li>{t('prefs.shortcut_tab_copy')}</li>
              <li>{t('prefs.shortcut_copy_shortcut')}</li>
              <li>{t('prefs.shortcut_refresh')}</li>
              <li>{t('prefs.shortcut_prefs')}</li>
              <li>{t('prefs.shortcut_close_prefs')}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
