export function languageDisplayName(code: string, uiLang: 'fr' | 'en' = 'en'): string {
  const c = code.toLowerCase();
  const mapEn: Record<string, string> = {
    ar: 'Arabic', bg: 'Bulgarian', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German',
    el: 'Greek', en: 'English', es: 'Spanish', et: 'Estonian', fa: 'Persian', fi: 'Finnish',
    fr: 'French', he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', hu: 'Hungarian', id: 'Indonesian',
    it: 'Italian', ja: 'Japanese', ko: 'Korean', lt: 'Lithuanian', lv: 'Latvian', ms: 'Malay',
    nb: 'Norwegian Bokmål', nl: 'Dutch', pl: 'Polish', pt: 'Portuguese', 'pt-br': 'Portuguese (Brazil)',
    ro: 'Romanian', ru: 'Russian', sk: 'Slovak', sl: 'Slovenian', sr: 'Serbian', sv: 'Swedish',
    th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu', vi: 'Vietnamese', zh: 'Chinese',
    'zh-cn': 'Chinese (Simplified)', 'zh-tw': 'Chinese (Traditional)'
  };
  const mapFr: Record<string, string> = {
    ar: 'Arabe', bg: 'Bulgare', bn: 'Bengali', cs: 'Tchèque', da: 'Danois', de: 'Allemand',
    el: 'Grec', en: 'Anglais', es: 'Espagnol', et: 'Estonien', fa: 'Persan', fi: 'Finnois',
    fr: 'Français', he: 'Hébreu', hi: 'Hindi', hr: 'Croate', hu: 'Hongrois', id: 'Indonésien',
    it: 'Italien', ja: 'Japonais', ko: 'Coréen', lt: 'Lituanien', lv: 'Letton', ms: 'Malais',
    nb: 'Norvégien Bokmål', nl: 'Néerlandais', pl: 'Polonais', pt: 'Portugais', 'pt-br': 'Portugais (Brésil)',
    ro: 'Roumain', ru: 'Russe', sk: 'Slovaque', sl: 'Slovène', sr: 'Serbe', sv: 'Suédois',
    th: 'Thaï', tr: 'Turc', uk: 'Ukrainien', ur: 'Ourdou', vi: 'Vietnamien', zh: 'Chinois',
    'zh-cn': 'Chinois (simplifié)', 'zh-tw': 'Chinois (traditionnel)'
  };
  const name = (uiLang === 'fr' ? mapFr[c] : mapEn[c]) || mapEn[c];
  return name || code.toUpperCase();
}

