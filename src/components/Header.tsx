import React from 'react';
import { useI18n } from '../i18n';

type Props = {
  onOpenPrefs: () => void;
};

export const Header: React.FC<Props> = ({ onOpenPrefs }) => {
  const { t } = useI18n();

  return (
    <header className="header" role="banner">
      <div className="brand">
        <span aria-hidden>🔎</span>
        <strong>Instances Finder</strong>
      </div>
      <div className="spacer" aria-hidden="true" />
      <button type="button" onClick={onOpenPrefs} aria-label={t('header.preferences')}>
        {t('header.preferences')}
      </button>
    </header>
  );
};
