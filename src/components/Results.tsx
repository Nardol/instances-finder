import React, { useEffect, useState } from 'react';
import type { Instance } from '../types';
import { useI18n } from '../i18n';

function isValidDomain(domain: string): boolean {
  const d = domain.trim().toLowerCase();
  // Basic hostname validation (RFC-1123 style, no trailing dot)
  const re =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  return re.test(d);
}

function buildInstanceUrl(domain: string): string | null {
  if (!isValidDomain(domain)) return null;
  return `https://${domain}`;
}

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

export const Results = React.forwardRef<HTMLUListElement, Props>(function Results(
  { items },
  listRef
) {
  const { t } = useI18n();
  const [announce, setAnnounce] = useState('');
  const [active, setActive] = useState(0);
  const [controlsIdx, setControlsIdx] = useState<number | null>(null);

  // Ensure screen readers re-announce identical messages by clearing first
  const announcePolite = (msg: string) => {
    setAnnounce('');
    setTimeout(() => setAnnounce(msg), 0);
  };

  // Keep active in range when list changes
  useEffect(() => {
    if (active > items.length - 1) setActive(items.length ? 0 : 0);
  }, [items.length, active]);

  // Focus first item on request from App
  useEffect(() => {
    const handler = () => {
      if (!items.length) return;
      setActive(0);
      setControlsIdx(null);
      setTimeout(() => {
        if (listRef && typeof listRef !== 'function') {
          // Keep focus on the list container (listbox) to maintain SR focus mode
          listRef.current?.focus();
        }
      }, 0);
    };
    window.addEventListener('results:focus-first', handler);
    return () => window.removeEventListener('results:focus-first', handler);
  }, [items.length]);

  // Do not auto-focus on change; focus is requested by App via event to avoid SR mode switches.

  const focusIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActive(clamped);
  };

  const handleListKeyDown = async (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (items.length === 0) return;
    const isMod = e.ctrlKey || e.metaKey;
    // Let Tab reach controls within the active card; intercept only on container
    if (e.key === 'Tab') {
      if (e.shiftKey) return; // allow Shift+Tab to go back naturally
      e.preventDefault();
      setControlsIdx(active);
      setTimeout(() => {
        if (listRef && typeof listRef !== 'function') {
          const root = listRef.current;
          const btn = root?.querySelector(
            `li:nth-child(${active + 1}) .card-actions button`
          ) as HTMLButtonElement | null;
          btn?.focus();
        }
      }, 0);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setControlsIdx(null);
      if (listRef && typeof listRef !== 'function') listRef.current?.focus();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusIndex(active + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusIndex(active - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusIndex(0);
        break;
      case 'End':
        e.preventDefault();
        focusIndex(items.length - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        focusIndex(active + 10);
        break;
      case 'PageUp':
        e.preventDefault();
        focusIndex(active - 10);
        break;
      case 'Enter':
        e.preventDefault();
        {
          const u = buildInstanceUrl(items[active]?.domain);
          if (u) await openExternal(u);
        }
        break;
      case 'o':
      case 'O':
        if (isMod) {
          e.preventDefault();
          const u = buildInstanceUrl(items[active]?.domain);
          if (u) await openExternal(u);
        }
        break;
      case 'c':
      case 'C':
        if (isMod && e.shiftKey) {
          e.preventDefault();
          const u = buildInstanceUrl(items[active]?.domain);
          const ok = u ? await copyText(u) : false;
          if (ok) announcePolite(t('results.copied'));
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="results" role="region" aria-labelledby="results-title">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
      <ul
        className="result-list"
        role="listbox"
        aria-label={t('results.list_label', { count: items.length })}
        aria-activedescendant={
          items.length ? `opt-${items[active]?.domain.replace(/[^a-zA-Z0-9_-]/g, '-')}` : undefined
        }
        ref={listRef}
        tabIndex={0}
        onKeyDown={handleListKeyDown}
      >
        {items.map((it, idx) => {
          const idSafe = it.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
          const titleId = `title-${idSafe}`;
          const descId = `desc-${idSafe}`;
          const factsId = `facts-${idSafe}`;
          return (
            <li
              key={it.domain}
              id={`opt-${idSafe}`}
              className={`card${active === idx ? ' is-active' : ''}`}
              role="option"
              aria-selected={active === idx}
              aria-labelledby={`${titleId} ${descId}`}
              aria-describedby={factsId}
              aria-keyshortcuts="Enter, Control+O, Meta+O, Control+C, Meta+C, ArrowUp, ArrowDown, Home, End"
              onMouseEnter={() => setActive(idx)}
            >
              <div className="card-body">
                <h3 id={titleId}>
                  <a
                    href={buildInstanceUrl(it.domain) ?? '#'}
                    aria-describedby={factsId}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      const u = buildInstanceUrl(it.domain);
                      if (u) void openExternal(u);
                    }}
                  >
                    {it.domain}
                  </a>
                </h3>
                <p id={descId}>{it.description}</p>
                <p id={factsId}>
                  <span>{it.languages.join(', ').toUpperCase()}</span>
                  {' · '}
                  <span>{it.signups === 'open' ? t('results.open') : t('results.approval')}</span>
                  {' · '}
                  <span>{it.sizeLabel}</span>
                </p>
              </div>
              {active === idx && (
                <div className="kbd-hint" aria-hidden="true">
                  <span>{t('results.hint_open')}</span>
                  <span className="sep">•</span>
                  <span>{t('results.hint_copy_tab')}</span>
                  <span className="sep">•</span>
                  <span>{t('results.hint_copy_shortcut')}</span>
                </div>
              )}
              <div className="card-actions" aria-hidden={controlsIdx !== idx}>
                <button
                  tabIndex={controlsIdx === idx ? 0 : -1}
                  onClick={async () => {
                    const u = buildInstanceUrl(it.domain);
                    const ok = u ? await copyText(u) : false;
                    if (ok) {
                      announcePolite(t('results.copied'));
                      window.dispatchEvent(
                        new CustomEvent('app:flash', { detail: t('results.copied') })
                      );
                    }
                  }}
                >
                  {t('results.copy')}
                </button>
                <button
                  tabIndex={controlsIdx === idx ? 0 : -1}
                  onClick={() => {
                    const u = buildInstanceUrl(it.domain);
                    if (u) void openExternal(u);
                  }}
                >
                  {t('results.openBrowser')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
