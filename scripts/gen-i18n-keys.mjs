#!/usr/bin/env node
import console from 'node:console';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultSrc = resolve(__dirname, '../src/locales/fr.json');
const defaultOut = resolve(__dirname, '../src/locales/i18n-keys.d.ts');

/** @param {any} obj @param {string[]} prefix @param {string[]} acc */
function walk(obj, prefix, acc) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      walk(v, [...prefix, k], acc);
    }
    return;
  }
  if (typeof obj === 'string') {
    acc.push(prefix.join('.'));
  }
}

export async function generateI18nKeys(src = defaultSrc, out = defaultOut) {
  const data = JSON.parse(readFileSync(src, 'utf8'));
  const keys = [];
  walk(data, [], keys);
  const uniq = Array.from(new Set(keys)).sort();

  const header = `// Auto-generated from src/locales/fr.json. Do not edit by hand.\n`;
  const body = uniq.length
    ? `export type I18nKey = ${uniq.map((k) => JSON.stringify(k)).join(' | ')};\n`
    : `export type I18nKey = string;\n`;

  const prettierConfig = await resolveConfig(out);
  const content = await format(header + body, { ...prettierConfig, filepath: out });
  const changed = !existsSync(out) || readFileSync(out, 'utf8') !== content;

  if (changed) {
    writeFileSync(out, content);
  }

  return { changed, keyCount: uniq.length };
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  const { keyCount } = await generateI18nKeys();
  console.log(`Generated ${defaultOut} with ${keyCount} keys.`);
}
