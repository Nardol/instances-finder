import React, { createContext, useContext, useMemo, useState } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';

type Dict = typeof fr;
type Lang = 'fr' | 'en';

function format(template: string, params?: Record<string, unknown>) {
  if (!params) return template;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return template.replace(/\{(\w+)\}/g, (_match, k) => String(params[k] ?? ''));
}

const dictionaries: Record<Lang, Dict> = { fr, en };

const I18nContext = createContext({
  lang: 'fr' as Lang,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLang: (_: Lang) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  t: (key: keyof Dict | string, _params?: Record<string, unknown>) => String(key),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const browserLang = (navigator.language || 'fr').slice(0, 2) as Lang;
  const [lang, setLang] = useState<Lang>(browserLang === 'en' ? 'en' : 'fr');

  const dict = dictionaries[lang];
  const t = (key: keyof Dict | string, params?: Record<string, unknown>) => {
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
