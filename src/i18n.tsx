import React, { createContext, useContext, useMemo, useState } from 'react';
import frData from './locales/fr.json';
import enData from './locales/en.json';
import { format } from './lib/format';
import type { I18nKey } from './locales/i18n-keys';

type Dict = typeof frData;
type Lang = 'fr' | 'en';

const dictionaries: Record<Lang, Dict> = { fr: frData, en: enData };

const I18nContext = createContext({
  lang: 'fr' as Lang,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLang: (_: Lang) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  t: (key: I18nKey | string, _params?: Record<string, unknown>) => String(key),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const browserLang = (navigator.language || 'fr').slice(0, 2) as Lang;
  const [lang, setLang] = useState<Lang>(browserLang === 'en' ? 'en' : 'fr');

  const dict = dictionaries[lang];
  const t = (key: I18nKey | string, params?: Record<string, unknown>) => {
    const path = String(key).split('.');
    let ref: unknown = dict;
    for (const p of path) {
      if (ref && typeof ref === 'object') {
        ref = (ref as Record<string, unknown>)[p];
      } else {
        ref = undefined;
        break;
      }
    }
    if (typeof ref === 'string') return format(ref, params);
    return String(key);
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export type { Lang };
