import React, { useEffect, useState } from 'react';
import type { Instance } from '../types';
import { useI18n } from '../i18n';

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_e) {
    void _e;
  }
  try {
    const mod = await import('@tauri-apps/api/clipboard');
    const clip = mod as unknown as { writeText?: (s: string) => Promise<void> };
    if (clip?.writeText) {
      await clip.writeText(text);
      return true;
    }
  } catch (_e) {
    void _e;
  }
  // Fallback hidden textarea
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

async function openExternal(url: string): Promise<void> {
  try {
    const { open } = await import('@tauri-apps/api/shell');
    await open(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

type Props = { items: Instance[] };

export const Results = React.forwardRef<HTMLDivElement, Props>(function Results(
  { items },
  listRef
) {
  const SR_STRICT = true; // disable custom arrow handling to let Orca fully drive table nav
  const { t } = useI18n();
  const [announce, setAnnounce] = useState('');
  const [active, setActive] = useState(0); // active row index

  // Ensure screen readers re-announce identical messages by clearing first
  const announcePolite = (msg: string) => {
    setAnnounce('');
    setTimeout(() => setAnnounce(msg), 0);
  };

  // Keep active in range when list changes
  useEffect(() => {
    if (active > items.length - 1) setActive(items.length ? 0 : 0);
  }, [items.length]);

  // Ensure a focus target exists when items load the first time
  useEffect(() => {
    if (!items.length) return;
    const idSafe = items[Math.max(0, Math.min(items.length - 1, active))]?.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
    const link = document.getElementById(`link-${idSafe}`) as HTMLAnchorElement | null;
    if (link && document.activeElement === document.body) {
      link.focus();
    }
  }, [items, active]);

  // Listen for App request to focus the first cell after results load
  useEffect(() => {
    const handler = () => {
      if (!items.length) return;
      const idSafe = items[0]?.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
      const link = document.getElementById(`link-${idSafe}`) as HTMLAnchorElement | null;
      if (link) { setActive(0); link.focus(); }
    };
    window.addEventListener('results:focus-first', handler);
    return () => window.removeEventListener('results:focus-first', handler);
  }, [items]);


  return (
    <div className="results" role="region" aria-labelledby="results-title">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
      <div className="table-wrap" ref={listRef}>
        <table className="results-table" aria-label={t('results.list_label', { count: items.length })}>
          <thead>
            <tr>
              <th id="h-domain">{t('results.col_domain')}</th>
              <th id="h-langs">{t('results.col_languages')}</th>
              <th id="h-signups">{t('results.col_signups')}</th>
              <th id="h-size">{t('results.col_size')}</th>
              <th id="h-actions">{t('results.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const idSafe = it.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
              const descId = `desc-${idSafe}`;
              return (
                <tr key={it.domain} onMouseEnter={() => setActive(idx)}>
                  <td headers="h-domain">
                    <div className="cell-domain">
                      <a
                        href={`https://${it.domain}`}
                        id={`link-${idSafe}`}
                        aria-describedby={descId}
                        onClick={(e) => {
                          e.preventDefault();
                          openExternal(`https://${it.domain}`);
                        }}
                      >
                        {it.domain}
                      </a>
                      <p id={descId} className="muted">{it.description}</p>
                    </div>
                  </td>
                  <td headers="h-langs">{it.languages.join(', ').toUpperCase()}</td>
                  <td headers="h-signups">{it.signups === 'open' ? t('results.open') : t('results.approval')}</td>
                  <td headers="h-size">{it.sizeLabel}</td>
                  <td headers="h-actions" className="cell-actions">
                    <button
                      onClick={async () => {
                        const ok = await copyText(`https://${it.domain}`);
                        if (ok) {
                          announcePolite(t('results.copied'));
                          window.dispatchEvent(new CustomEvent('app:flash', { detail: t('results.copied') }));
                        }
                      }}
                    >
                      {t('results.copy')}
                    </button>
                    <button onClick={() => openExternal(`https://${it.domain}`)}>
                      {t('results.openBrowser')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
