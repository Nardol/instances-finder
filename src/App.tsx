import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Wizard } from './components/Wizard';
import { Results } from './components/Results';
import { LiveRegion } from './components/LiveRegion';
import { PreferencesModal } from './components/PreferencesModal';
import { useI18n } from './i18n';
import type { Instance, Preferences } from './types';
import { rankInstances } from './lib/score';
import { TokenSetup } from './components/TokenSetup';
import { fetchInstances, clearInstancesCache, fetchLanguages } from './lib/api';
import { AppShell } from './components/AppShell';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_IPC__' in window;

const App: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const [prefs, setPrefs] = useState<Preferences>({
    languages: ['fr'],
    size: 'any',
    moderation: 'any',
    signups: 'any',
    region: 'any',
    nsfw: 'any',
  });
  const [results, setResults] = useState<Instance[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error' | 'needs_token'>(
    'idle'
  );
  const [tokenReady, setTokenReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [errorLive, setErrorLive] = useState<string>('');
  const [expert, setExpert] = useState<boolean>(false);
  const [brailleRefresh, setBrailleRefresh] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState<boolean>(false);
  const [availableLangs, setAvailableLangs] = useState<string[]>(['fr', 'en']);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<HTMLDivElement | null>(null);
  const resultsListRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!tokenReady) {
      setStatus('needs_token');
      setResults([]);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    let cancelled = false;
    const run = async () => {
      try {
        const items = await fetchInstances({
          language: prefs.languages.length ? prefs.languages[0] : undefined,
          include_closed: false,
          include_down: false,
          max: 200,
          signups: prefs.signups === 'any' ? undefined : (prefs.signups as 'open' | 'approval'),
          region: expert && prefs.region !== 'any' ? prefs.region : undefined,
          size: prefs.size === 'any' ? undefined : prefs.size,
        }, import.meta.env.DEV || refreshTick > 0);
        if (cancelled) return;
        const normalized: Instance[] = items.map((it) => {
          const reg =
            it.region === 'eu' || it.region === 'na' || it.region === 'other' ? it.region : 'other';
          const sz = it.size as 1 | 2 | 3;
          return {
            domain: it.domain,
            description: it.description,
            languages: Array.isArray(it.languages) ? it.languages.map((l) => l.toLowerCase()) : [],
            signups: it.signups,
            size: sz,
            sizeLabel: it.sizeLabel,
            region: reg,
            availability: it.availability,
          };
        });
        const ranked = rankInstances(normalized, prefs);
        setResults(ranked);
        setStatus('done');
        try {
          window.dispatchEvent(
            new CustomEvent('app:flash', { detail: t('status.done', { count: ranked.length }) })
          );
        } catch (_) {}
        // After results load, focus the grid container to keep Orca in focus mode
        setTimeout(() => {
          resultsListRef.current?.focus();
        }, 0);
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(t('status.error'));
          setStatus('error');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [prefs, tokenReady, expert, t, refreshTick]);

  // Fetch all available languages once token is ready
  useEffect(() => {
    if (!tokenReady) return;
    (async () => {
      try {
        const langs = await fetchLanguages();
        if (Array.isArray(langs) && langs.length) setAvailableLangs(langs);
      } catch (_) {
        // ignore
      }
    })();
  }, [tokenReady]);

  const onApply = (p: Preferences) => setPrefs(p);

  const statusText = useMemo(() => {
    if (status === 'loading') return t('status.loading');
    if (status === 'done') return t('status.done', { count: results.length });
    if (status === 'needs_token') return t('status.needs_token');
    if (status === 'error') return errorMsg;
    return '';
  }, [status, results.length, t, errorMsg]);

  useEffect(() => {
    if (status === 'error') {
      setErrorLive(errorMsg || t('status.error'));
    } else {
      setErrorLive('');
    }
  }, [status, errorMsg, t]);

  // React to native "Preferences" menu: open modal preferences.
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    (async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen('menu://preferences', () => {
        setPrefsOpen(true);
      });
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Mirror status and flash into a live region for Orca
  useEffect(() => {
    if (!liveRef.current) return;
    liveRef.current.textContent = statusText || '';
  }, [statusText]);

  useEffect(() => {
    if (!liveRef.current) return;
    if (flash) liveRef.current.textContent = flash;
  }, [flash]);

  // React to native Refresh
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    (async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen('menu://refresh', async () => {
        try {
          await clearInstancesCache();
        } catch (_) {}
        setRefreshTick((n) => n + 1);
      });
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // App-wide flash message for status bar
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      setFlash(ce.detail || null);
      window.setTimeout(() => setFlash(null), 2000);
    };
    window.addEventListener('app:flash', handler as any);
    return () => window.removeEventListener('app:flash', handler as any);
  }, []);

  // Toggle inert on background when preferences open
  useEffect(() => {
    const el = appRef.current;
    if (!el) return;
    if (prefsOpen) {
      el.setAttribute('inert', '');
    } else {
      el.removeAttribute('inert');
    }
  }, [prefsOpen]);

  // React to in-app refresh button (DOM event)
  useEffect(() => {
    const handler = async () => {
      try {
        await clearInstancesCache();
      } catch (_) {}
      setRefreshTick((n) => n + 1);
    };
    window.addEventListener('app:refresh', handler as any);
    return () => window.removeEventListener('app:refresh', handler as any);
  }, []);

  return (
    <AppShell statusText={statusText} flashText={flash}>
      <div
        ref={appRef}
        className="app"
        aria-labelledby="app-title"
        aria-hidden={prefsOpen}
      >
        <Header onOpenPrefs={() => setPrefsOpen(true)} />

        <main id="main" className="main" role="main">
          <h1 id="app-title" className="visually-hidden">
            {t('app.title')}
          </h1>
          {!tokenReady ? <TokenSetup onReady={() => setTokenReady(true)} /> : null}
          <Wizard
            prefs={prefs}
            onApply={onApply}
            expert={expert}
            languagesList={availableLangs}
            brailleRefresh={brailleRefresh}
          />
          <section aria-labelledby="results-title">
            <h2 id="results-title">{t('results.title')}</h2>
            <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
              {errorLive}
            </div>
            <Results ref={resultsListRef} items={results} />
          </section>
        </main>

        <LiveRegion ref={liveRef} />
      </div>
      <PreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        lang={lang}
        onChangeLang={setLang}
        expert={expert}
        onToggleExpert={setExpert}
        brailleRefresh={brailleRefresh}
        onToggleBrailleRefresh={setBrailleRefresh}
      />
    </AppShell>
  );
};

export default App;
