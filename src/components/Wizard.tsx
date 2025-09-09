import React, { useId, useState } from 'react';
import { useI18n } from '../i18n';
import type { Preferences } from '../types';
import { CheckboxList } from './CheckboxList';
import { languageDisplayName } from '../lib/languages';

type Props = {
  prefs: Preferences;
  onApply: (p: Preferences) => void;
  expert?: boolean;
  languagesList?: string[];
};

export const Wizard: React.FC<Props> = ({ prefs, onApply, expert = false, languagesList }) => {
  const { t } = useI18n();
  const [local, setLocal] = useState<Preferences>(prefs);
  const titleId = useId();

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section aria-labelledby={titleId} className="wizard">
      <h2 id={titleId}>{t('wizard.title')}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply(local);
        }}
      >
        <fieldset>
          <legend className="label">{t('wizard.languages')}</legend>
          <div className="row" style={{ marginBottom: '.5rem' }}>
            <button
              type="button"
              onClick={() => update('languages', Array.from(new Set([...(languagesList ?? ['fr','en'])].map((l) => l.toLowerCase()))))}
            >
              {t('wizard.select_all')}
            </button>
            <button type="button" onClick={() => update('languages', [])}>
              {t('wizard.clear_all')}
            </button>
          </div>
          <CheckboxList
            label={t('wizard.languages')}
            filterPlaceholder={t('wizard.languages_filter')}
            announcementLabels={{ selected: t('wizard.selected'), notSelected: t('wizard.not_selected') }}
            items={(languagesList ?? ['fr', 'en']).map((code) => ({
              id: `lang-${code}`,
              label: languageDisplayName(code, (t('header.fr') ? 'fr' : 'en') as 'fr' | 'en') + ` (${code.toUpperCase()})`,
              checked: local.languages.includes(code),
              onToggle: (next: boolean) =>
                update(
                  'languages',
                  next
                    ? Array.from(new Set([...local.languages, code]))
                    : local.languages.filter((l) => l !== code)
                ),
            }))}
          />
          <p style={{ marginTop: 4, fontSize: '0.9rem', opacity: 0.8 }}>
            {t('wizard.languages_hint')}
          </p>
        </fieldset>

        <div className="row">
          <label className="label" htmlFor="size-select">
            {t('wizard.size')}
            {local.size === 'any' && <span className="badge-muted">{t('wizard.indifferent')}</span>}
          </label>
          <select
            id="size-select"
            value={local.size}
            onChange={(e) => update('size', e.target.value as Preferences['size'])}
          >
            <option value="any">{t('wizard.indifferent')}</option>
            <option value="small">{t('wizard.size_small')}</option>
            <option value="medium">{t('wizard.size_medium')}</option>
            <option value="large">{t('wizard.size_large')}</option>
          </select>
        </div>

        <div className="row">
          <label className="label" htmlFor="moderation-select">
            {t('wizard.moderation')}
            {local.moderation === 'any' && <span className="badge-muted">{t('wizard.indifferent')}</span>}
          </label>
          <select
            id="moderation-select"
            value={local.moderation}
            onChange={(e) => update('moderation', e.target.value as Preferences['moderation'])}
          >
            <option value="any">{t('wizard.indifferent')}</option>
            <option value="open">{t('wizard.moderation_open')}</option>
            <option value="balanced">{t('wizard.moderation_balanced')}</option>
            <option value="strict">{t('wizard.moderation_strict')}</option>
          </select>
        </div>

        <div className="row">
          <label className="label" htmlFor="signups-select">
            {t('wizard.signups')}
            {local.signups === 'any' && <span className="badge-muted">{t('wizard.indifferent')}</span>}
          </label>
          <select
            id="signups-select"
            value={local.signups}
            onChange={(e) => update('signups', e.target.value as Preferences['signups'])}
          >
            <option value="any">{t('wizard.indifferent')}</option>
            <option value="open">{t('wizard.signups_open')}</option>
            <option value="approval">{t('wizard.signups_approval')}</option>
          </select>
        </div>

        {expert && (
          <div className="row">
            <label className="label" htmlFor="region-select">
              {t('wizard.region_experimental')}
              {local.region === 'any' && <span className="badge-muted">{t('wizard.indifferent')}</span>}
            </label>
            <select
              id="region-select"
              value={local.region}
              onChange={(e) => update('region', e.target.value as Preferences['region'])}
            >
              <option value="any">{t('wizard.indifferent')}</option>
              <option value="eu">{t('wizard.region_eu')}</option>
              <option value="na">{t('wizard.region_na')}</option>
              <option value="other">{t('wizard.region_other')}</option>
            </select>
          </div>
        )}

        <div className="row">
          <label className="label" htmlFor="nsfw-select">
            {t('wizard.nsfw')}
            {local.nsfw === 'any' && <span className="badge-muted">{t('wizard.indifferent')}</span>}
          </label>
          <select
            id="nsfw-select"
            value={local.nsfw}
            onChange={(e) => update('nsfw', e.target.value as Preferences['nsfw'])}
          >
            <option value="any">{t('wizard.indifferent')}</option>
            <option value="allowed">{t('wizard.nsfw_allowed')}</option>
            <option value="limited">{t('wizard.nsfw_limited')}</option>
          </select>
        </div>

        <div className="actions">
          <button type="submit" className="primary">
            {t('wizard.apply')}
          </button>
        </div>
      </form>
    </section>
  );
};
