import React from 'react';
import { useI18n, Lang } from '../i18n';

type Props = {
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  expert: boolean;
  onToggleExpert: (v: boolean) => void;
};

export const Header: React.FC<Props> = ({ lang, onChangeLang, expert, onToggleExpert }) => {
  const { t } = useI18n();

  return (
    <header className="header" role="banner">
      <div className="brand">
        <span aria-hidden>🔎</span>
        <strong>Instances Finder</strong>
      </div>
      <div className="spacer" aria-hidden="true" />
      <label htmlFor="lang-select" className="label">{t('header.language')}</label>
      <select
        id="lang-select"
        value={lang}
        onChange={(e) => onChangeLang(e.target.value as Lang)}
        aria-label={t('header.language')}
      >
        <option value="fr">{t('header.fr')}</option>
        <option value="en">{t('header.en')}</option>
      </select>
      <label style={{ marginLeft: '1rem' }}>
        <input type="checkbox" checked={expert} onChange={(e) => onToggleExpert(e.target.checked)} /> {t('header.expert')}
      </label>
    </header>
  );
};
