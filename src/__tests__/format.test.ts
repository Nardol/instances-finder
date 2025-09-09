import { describe, it, expect } from 'vitest';
import { format } from '../lib/format';

describe('format()', () => {
  it('replaces placeholders with provided params', () => {
    expect(format('Hello {name}', { name: 'World' })).toBe('Hello World');
  });

  it('uses empty string for missing keys', () => {
    expect(format('Hello {name}', {})).toBe('Hello ');
  });

  it('returns template when no params', () => {
    expect(format('Plain text')).toBe('Plain text');
  });

  it('stringifies non-string values', () => {
    expect(format('{n}:{b}', { n: 42, b: false })).toBe('42:false');
  });
});

