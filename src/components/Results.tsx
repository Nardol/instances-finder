import React, { useState } from 'react';
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

export const Results: React.FC<Props> = ({ items }) => {
  const { t } = useI18n();
  const [announce, setAnnounce] = useState('');

  return (
    <div
      className="results"
      role="region"
      aria-labelledby="results-title"
      aria-live="polite"
      aria-atomic="false"
    >
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <h2 id="results-title" className="sr-only">
        {t('results.title')}
      </h2>
      <ul className="result-list">
        {items.map((it) => {
          const idSafe = it.domain.replace(/[^a-zA-Z0-9_-]/g, '-');
          const factsId = `facts-${idSafe}`;
          return (
          <li key={it.domain} className="card">
            <div className="card-body">
              <h3>
                <a
                  href={`https://${it.domain}`}
                  aria-describedby={factsId}
                  onClick={(e) => {
                    e.preventDefault();
                    openExternal(`https://${it.domain}`);
                  }}
                >
                  {it.domain}
                </a>
              </h3>
              <p>{it.description}</p>
              <p id={factsId}>
                <span>{it.languages.join(', ').toUpperCase()}</span>
                {' · '}
                <span>{it.signups === 'open' ? t('results.open') : t('results.approval')}</span>
                {' · '}
                <span>{it.sizeLabel}</span>
              </p>
            </div>
            <div className="card-actions">
              <button
                onClick={async () => {
                  const ok = await copyText(`https://${it.domain}`);
                  if (ok) setAnnounce(t('results.copied'));
                }}
              >
                {t('results.copy')}
              </button>
              <button onClick={() => openExternal(`https://${it.domain}`)}>
                {t('results.openBrowser')}
              </button>
            </div>
          </li>
          );})}
      </ul>
    </div>
  );
};
