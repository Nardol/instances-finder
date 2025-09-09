import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { tokenStatus, testToken, saveToken } from '../lib/api';
import { open } from '@tauri-apps/api/shell';

type Props = { onReady: () => void };

export const TokenSetup: React.FC<Props> = ({ onReady }) => {
  const { t } = useI18n();
  const [token, setToken] = useState('');
  const [persist, setPersist] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  React.useEffect(() => {
    tokenStatus().then((ok) => {
      if (ok) onReady();
    });
  }, [onReady]);

  const handleTest = async () => {
    try {
      setBusy(true);
      setStatus(t('token.testing'));
      await testToken(token || undefined);
      setStatus(t('token.valid'));
    } catch (_e) {
      setStatus(t('token.invalid'));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveToken(token, persist);
      onReady();
    } catch (_e) {
      setStatus(t('token.save_error'));
    }
  };

  return (
    <section className="wizard" aria-labelledby="token-title" aria-busy={busy}>
      <h2 id="token-title">{t('token.title')}</h2>
      <p>{t('token.desc')}</p>
      <div className="row">
        <button onClick={() => open('https://instances.social/api/token')}>{t('token.get')}</button>
      </div>
      <div className="row">
        <label className="label" htmlFor="token-input">
          {t('token.input')}
        </label>
        <input
          id="token-input"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          aria-describedby="token-help"
        />
      </div>
      <p id="token-help">{t('token.help')}</p>
      <div className="row">
        <label>
          <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />{' '}
          {t('token.persist')}
        </label>
      </div>
      <div className="actions">
        <button onClick={handleTest}>{t('token.test')}</button>
        <button className="primary" onClick={handleSave}>
          {t('token.save')}
        </button>
      </div>
      <p role="status" aria-live="assertive" aria-atomic="true">
        {status}
      </p>
    </section>
  );
};
