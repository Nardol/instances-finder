import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateI18nKeys } from './gen-i18n-keys.mjs';

const generatedContent = `// Auto-generated from src/locales/fr.json. Do not edit by hand.
export type I18nKey = 'app.title' | 'header.language';
`;

describe('generateI18nKeys()', () => {
  let directory;

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function createFixture(output = 'altered content\n') {
    directory = mkdtempSync(join(tmpdir(), 'instances-finder-i18n-'));
    const src = join(directory, 'fr.json');
    const out = join(directory, 'i18n-keys.d.ts');

    writeFileSync(
      join(directory, '.prettierrc'),
      JSON.stringify({ printWidth: 100, semi: true, singleQuote: true })
    );
    writeFileSync(
      src,
      JSON.stringify({ header: { language: 'Langue' }, app: { title: 'Instances Finder' } })
    );
    writeFileSync(out, output);

    return { out, src };
  }

  it('replaces an altered file with the canonical generated content', async () => {
    const { out, src } = createFixture();

    const result = await generateI18nKeys(src, out);

    expect(result).toEqual({ changed: true, keyCount: 2 });
    expect(readFileSync(out, 'utf8')).toBe(generatedContent);
  });

  it('does not rewrite an already up-to-date file', async () => {
    const { out, src } = createFixture(generatedContent);
    const oldTimestamp = new Date('2020-01-01T00:00:00Z');
    utimesSync(out, oldTimestamp, oldTimestamp);
    const mtimeBefore = statSync(out).mtimeMs;

    const result = await generateI18nKeys(src, out);

    expect(result).toEqual({ changed: false, keyCount: 2 });
    expect(statSync(out).mtimeMs).toBe(mtimeBefore);
  });
});
