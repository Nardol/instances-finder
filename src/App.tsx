import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Wizard } from './components/Wizard';
import { Results } from './components/Results';
import { LiveRegion } from './components/LiveRegion';
import { useI18n } from './i18n';
import type { Instance, Preferences } from './types';
import { mockInstances } from './mocks/instances';
import { rankInstances } from './lib/score';
import { TokenSetup } from './components/TokenSetup';
import { fetchInstances } from './lib/api';

const App: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const [prefs, setPrefs] = useState<Preferences>({
    languages: ['fr'],
    size: 'medium',
    moderation: 'balanced',
    signups: 'open',
    region: 'eu',
    nsfw: 'allowed',
  });
  const [results, setResults] = useState<Instance[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error' | 'needs_token'>('idle');
  const [tokenReady, setTokenReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [errorLive, setErrorLive] = useState<string>('');
  const [expert, setExpert] = useState<boolean>(false);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tokenReady) { setStatus('needs_token'); setResults([]); return; }
    setStatus('loading'); setErrorMsg('');
    let cancelled = false;
    const run = async () => {
      try {
        const items = await fetchInstances({
          language: prefs.languages[0],
          include_closed: false,
          include_down: false,
          max: 200,
          signups: prefs.signups,
          region: expert ? prefs.region : undefined,
          size: prefs.size,
        });
        if (cancelled) return;
        const normalized = items.map(it => ({
          domain: it.domain,
          description: it.description,
          languages: it.languages.includes('fr') ? ['fr'] : ['en'],
          signups: it.signups,
          size: (it.size as 1|2|3),
          sizeLabel: it.sizeLabel,
          region: (it.region as any),
          availability: it.availability,
        }));
        const ranked = rankInstances(normalized as any, prefs);
        setResults(ranked);
        setStatus('done');
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(t('status.error'));
          setStatus('error');
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [prefs, tokenReady, expert, t]);

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

  return (
    <div className="app" aria-labelledby="app-title">
      <Header lang={lang} onChangeLang={setLang} expert={expert} onToggleExpert={setExpert} />

      <main id="main" className="main" role="main">
        <h1 id="app-title" className="visually-hidden">{t('app.title')}</h1>
        {!tokenReady ? <TokenSetup onReady={() => setTokenReady(true)} /> : null}
        <Wizard prefs={prefs} onApply={onApply} expert={expert} />
        <section aria-labelledby="results-title">
          <h2 id="results-title">{t('results.title')}</h2>
          <p role="status" aria-live="polite" aria-atomic="true">{statusText}</p>
          <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">{errorLive}</div>
          <Results items={results} />
        </section>
      </main>

      <LiveRegion ref={liveRef} />
    </div>
  );
};

export default App;
