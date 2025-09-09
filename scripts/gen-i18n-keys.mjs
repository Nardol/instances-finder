#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const src = resolve(__dirname, '../src/locales/fr.json');
const out = resolve(__dirname, '../src/locales/i18n-keys.d.ts');

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

const data = JSON.parse(readFileSync(src, 'utf8'));
const keys = [];
walk(data, [], keys);
const uniq = Array.from(new Set(keys)).sort();

const header = `// Auto-generated from src/locales/fr.json. Do not edit by hand.\n`;
const body = uniq.length
  ? `export type I18nKey = ${uniq.map(k => JSON.stringify(k)).join(' | ')};\n`
  : `export type I18nKey = string;\n`;

writeFileSync(out, header + body);
console.log(`Generated ${out} with ${uniq.length} keys.`);

