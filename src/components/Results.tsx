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
  const [active, setActive] = useState(0); // active row index
  const [col, setCol] = useState(0); // active column index within the grid
  const [controlsIdx, setControlsIdx] = useState<number | null>(null);

  // Ensure screen readers re-announce identical messages by clearing first
  const announcePolite = (msg: string) => {
    setAnnounce('');
    setTimeout(() => setAnnounce(msg), 0);
  };

  // Keep active in range when list changes
  useEffect(() => {
    if (active > items.length - 1) setActive(items.length ? 0 : 0);
    // Reset column to first when the dataset changes
    setCol(0);
  }, [items.length]);

  const focusIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActive(clamped);
    // Keep focus on the listbox to maintain Orca focus mode
    if (listRef && typeof listRef !== 'function') {
      listRef.current?.focus();
    }
  };

  const handleListKeyDown = async (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (items.length === 0) return;
    const isMod = e.ctrlKey || e.metaKey;
    // Allow Tab navigation when focus is already inside interactive controls
    if (e.key === 'Tab' && e.currentTarget !== e.target) {
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setControlsIdx(null);
      if (listRef && typeof listRef !== 'function') listRef.current?.focus();
      return;
    }
    const colCount = 3;
    const moveRow = (delta: number) => focusIndex(active + delta);
    const moveCol = (delta: number) => setCol((c) => Math.max(0, Math.min(colCount - 1, c + delta)));
    const key = e.key;
    const ctrlAlt = e.ctrlKey && e.altKey; // Orca table navigation

    switch (key) {
      case 'Tab': {
        if (e.shiftKey) {
          // Allow Shift+Tab to escape the listbox naturally
          return;
        }
        // Move focus into the active item's controls (Copy/Open)
        // so users can access buttons without leaving the widget context.
        e.preventDefault();
        setControlsIdx(active);
        // Defer focus to let buttons become tabbable
        setTimeout(() => {
          if (listRef && typeof listRef !== 'function') {
            const root = listRef.current;
            const btn = root?.querySelector(
              `li:nth-child(${active + 2}) .card-actions button`
            ) as HTMLButtonElement | null;
            btn?.focus();
          }
        }, 0);
        break; }
      case 'ArrowDown':
        // Move to next row; let Orca Ctrl+Alt+Down pass through
        if (ctrlAlt) return;
        e.preventDefault();
        focusIndex(active + 1);
        break;
      case 'ArrowUp':
        if (ctrlAlt) return;
        e.preventDefault();
        focusIndex(active - 1);
        break;
      case 'ArrowRight':
        // Let Orca Ctrl+Alt+Right read next column
        if (ctrlAlt) return;
        e.preventDefault();
        moveCol(1);
        break;
      case 'ArrowLeft':
        if (ctrlAlt) return;
        e.preventDefault();
        moveCol(-1);
        break;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl+Home: first cell of first row
          focusIndex(0);
          setCol(0);
        } else {
          // Home: first cell of current row
          setCol(0);
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl+End: last cell of last row
          focusIndex(items.length - 1);
          setCol(colCount - 1);
        } else {
          // End: last cell of current row
          setCol(colCount - 1);
        }
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
        openExternal(`https://${items[active]?.domain}`);
        break;
      case 'o':
      case 'O':
        if (isMod) {
          e.preventDefault();
          openExternal(`https://${items[active]?.domain}`);
        }
        break;
      case 'c':
      case 'C':
        if (isMod && e.shiftKey) {
          e.preventDefault();
          const ok = await copyText(`https://${items[active]?.domain}`);
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
        role="grid"
        aria-rowcount={items.length + 1}
        aria-colcount={3}
        aria-label={t('results.list_label', { count: items.length })}
        aria-activedescendant={
          items.length
            ? `cell-${items[active]?.domain.replace(/[^a-zA-Z0-9_-]/g, '-')}-${col}`
            : undefined
        }
        ref={listRef}
        data-active-col={col}
        tabIndex={0}
        onKeyDown={handleListKeyDown}
      >
        {/* Header row for screen readers and sighted users */}
        <li role="row" className="grid-header" aria-rowindex={1}>
          <div role="columnheader" id="colhdr-domain" aria-colindex={1} className={`cell ${col === 0 ? 'is-active' : ''}`}>
            {t('results.col_domain')}
          </div>
          <div role="columnheader" id="colhdr-details" aria-colindex={2} className={`cell ${col === 1 ? 'is-active' : ''}`}>
            {t('results.col_details')}
          </div>
          <div role="columnheader" id="colhdr-actions" aria-colindex={3} className={`cell ${col === 2 ? 'is-active' : ''}`}>
            {t('results.col_actions')}
          </div>
        </li>
        {items.map((it, idx) => {
          const idSafe = it.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
          const titleId = `title-${idSafe}`;
          const descId = `desc-${idSafe}`;
          const factsId = `facts-${idSafe}`;
          return (
          <li
            key={it.domain}
            className={`card ${active === idx ? 'is-active' : ''}`}
            role="row"
            aria-rowindex={idx + 2}
            onMouseEnter={() => setActive(idx)}
          >
            <div
              id={`cell-${idSafe}-0`}
              role="gridcell"
              aria-labelledby={`colhdr-domain ${titleId}`}
              aria-colindex={1}
              aria-selected={active === idx && col === 0}
              className="card-body col-0"
            >
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
            </div>
            <div
              id={`cell-${idSafe}-1`}
              role="gridcell"
              aria-labelledby={`colhdr-details ${titleId}`}
              aria-colindex={2}
              aria-selected={active === idx && col === 1}
              className="card-body col-1"
              aria-describedby={factsId}
            >
              <p id={factsId}>
                <span>{it.languages.join(', ').toUpperCase()}</span>
                {' · '}
                <span>{it.signups === 'open' ? t('results.open') : t('results.approval')}</span>
                {' · '}
                <span>{it.sizeLabel}</span>
              </p>
            </div>
            <div
              id={`cell-${idSafe}-2`}
              role="gridcell"
              aria-labelledby={`colhdr-actions ${titleId}`}
              aria-colindex={3}
              aria-selected={active === idx && col === 2}
              className="card-actions col-2"
            >
              {active === idx && (
                <div className="kbd-hint" aria-hidden="true">
                  <span>{t('results.hint_open')}</span>
                  <span className="sep">•</span>
                  <span>{t('results.hint_copy_tab')}</span>
                  <span className="sep">•</span>
                  <span>{t('results.hint_copy_shortcut')}</span>
                </div>
              )}
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
        );})}
      </ul>
    </div>
  );
});
