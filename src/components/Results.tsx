import React, { useEffect, useRef, useState } from 'react';
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

export const Results = React.forwardRef<HTMLUListElement, Props>(function Results(
  { items },
  listRef
) {
  const { t } = useI18n();
  const [announce, setAnnounce] = useState('');
  const [active, setActive] = useState(0);
  const [controlsIdx, setControlsIdx] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Ensure screen readers re-announce identical messages by clearing first
  const announcePolite = (msg: string) => {
    setAnnounce('');
    setTimeout(() => setAnnounce(msg), 0);
  };

  // Keep active in range when list changes
  useEffect(() => {
    if (active > items.length - 1) setActive(items.length ? 0 : 0);
  }, [items.length, active]);

  const focusIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActive(clamped);
    setTimeout(() => {
      const el = itemRefs.current[clamped];
      el?.focus();
    }, 0);
  };

  const onItemKeyDown = async (
    e: React.KeyboardEvent<HTMLLIElement>,
    index: number,
    domain: string
  ) => {
    const isMod = e.ctrlKey || e.metaKey;
    switch (e.key) {
      case 'Tab':
        // Reveal controls so the next focus lands on the Copy button
        setControlsIdx(index);
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusIndex(index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusIndex(index - 1);
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
        focusIndex(index + 10);
        break;
      case 'PageUp':
        e.preventDefault();
        focusIndex(index - 10);
        break;
      case 'Enter':
        e.preventDefault();
        openExternal(`https://${domain}`);
        break;
      case 'o':
      case 'O':
        if (isMod) {
          e.preventDefault();
          openExternal(`https://${domain}`);
        }
        break;
      case 'c':
      case 'C':
        if (isMod && e.shiftKey) {
          e.preventDefault();
          const ok = await copyText(`https://${domain}`);
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
        role="list"
        aria-label={t('results.list_label', { count: items.length })}
        ref={listRef}
        tabIndex={0}
      >
        {items.map((it, idx) => {
          const idSafe = it.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
          const titleId = `title-${idSafe}`;
          const descId = `desc-${idSafe}`;
          const factsId = `facts-${idSafe}`;
          return (
            <li
              key={it.domain}
              className="card"
              role="listitem"
              tabIndex={active === idx ? 0 : -1}
              aria-labelledby={`${titleId} ${descId}`}
              aria-describedby={factsId}
              aria-keyshortcuts="Enter, Control+O, Meta+O, Control+C, Meta+C, ArrowUp, ArrowDown, Home, End"
              ref={(el) => (itemRefs.current[idx] = el)}
              onKeyDown={(e) => onItemKeyDown(e, idx, it.domain)}
              onFocus={() => {
                setActive(idx);
                setControlsIdx(null);
              }}
            >
              <div className="card-body">
                <h3 id={titleId}>
                  <a
                    href={`https://${it.domain}`}
                    aria-describedby={factsId}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      openExternal(`https://${it.domain}`);
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
                    const ok = await copyText(`https://${it.domain}`);
                    if (ok) {
                      announcePolite(t('results.copied'));
                      window.dispatchEvent(new CustomEvent('app:flash', { detail: t('results.copied') }));
                    }
                  }}
                >
                  {t('results.copy')}
                </button>
                <button
                  tabIndex={controlsIdx === idx ? 0 : -1}
                  onClick={() => openExternal(`https://${it.domain}`)}
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
