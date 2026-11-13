/**
 * @file Specs for number formatting.
 */

import { describe, expect, it } from 'vitest';
import { createNumberFormatter, resolveFormat, varianceTone } from './format';
import { GridColumn, GridRow } from './types';

const en = createNumberFormatter('en-US');
const pt = createNumberFormatter('pt-PT');
const row = (extra: Partial<GridRow> = {}): GridRow => ({ id: 'r', data: {}, ...extra });

describe('createNumberFormatter', () => {
  it('groups thousands and shows two decimals by default', () => {
    expect(en.format(1234567.891)).toBe('1,234,567.89');
    expect(en.format(5)).toBe('5.00');
  });

  it('follows the locale', () => {
    expect(pt.format(1234567.5, { decimals: 1 })).toMatch(/^1.234.567,5$/);
  });

  it('honours decimals', () => {
    expect(en.format(1234.567, { decimals: 0 })).toBe('1,235');
    expect(en.format(1234.5, { decimals: 3 })).toBe('1,234.500');
  });

  it('shows negatives with a minus by default and in parentheses for accounting', () => {
    expect(en.format(-1234, { decimals: 0 })).toBe('-1,234');
    expect(en.format(-1234, { decimals: 0, negative: 'parentheses' })).toBe('(1,234)');
    expect(en.format(1234, { decimals: 0, negative: 'parentheses' })).toBe('1,234');
  });

  it('scales to thousands and millions', () => {
    expect(en.format(1_250_000, { scale: 1000, decimals: 0 })).toBe('1,250');
    expect(en.format(1_250_000, { scale: 1_000_000, decimals: 1 })).toBe('1.3');
  });

  it('uses the zero placeholder, including for values that round to zero', () => {
    expect(en.format(0, { zero: '–' })).toBe('–');
    expect(en.format(0.004, { zero: '–' })).toBe('–');
    expect(en.format(400, { zero: '–', scale: 1_000_000 })).toBe('–');
    expect(en.format(0)).toBe('0.00');
  });

  it('never shows a negative zero', () => {
    expect(en.format(-0.001)).toBe('0.00');
    expect(en.format(-0.001, { negative: 'parentheses' })).toBe('0.00');
  });

  it('reverses the sign for display', () => {
    expect(en.format(-500, { reverseSign: true, decimals: 0 })).toBe('500');
    expect(en.format(500, { reverseSign: true, decimals: 0, negative: 'parentheses' })).toBe('(500)');
  });

  it('formats percentages from fractions', () => {
    expect(en.format(0.1234, { style: 'percent' })).toBe('12.3%');
    expect(en.format(-0.05, { style: 'percent', decimals: 0, negative: 'parentheses' })).toBe('(5%)');
    expect(en.format(0.0004, { style: 'percent', zero: '–' })).toBe('–');
    expect(en.format(0.0006, { style: 'percent', zero: '–' })).toBe('0.1%');
  });

  it('reads decimal strings as numbers', () => {
    expect(en.format('1234.50')).toBe('1,234.50');
  });

  it('passes text through and shows nothing for empty values', () => {
    expect(en.format('n/a')).toBe('n/a');
    expect(en.format(null)).toBe('');
    expect(en.format(undefined)).toBe('');
    expect(en.format('')).toBe('');
  });
});

describe('resolveFormat', () => {
  const column: GridColumn = { id: 'jan', header: 'Jan', format: { decimals: 0, negative: 'parentheses' } };

  it('uses the column format when the row has none', () => {
    expect(resolveFormat(row(), column)).toEqual({ decimals: 0, negative: 'parentheses' });
  });

  it('lets the row override the column, key by key', () => {
    expect(resolveFormat(row({ format: { style: 'percent', decimals: 1 } }), column)).toEqual({
      style: 'percent', decimals: 1, negative: 'parentheses',
    });
  });

  it('returns undefined when neither has a format', () => {
    expect(resolveFormat(row(), { id: 'a', header: 'A' })).toBeUndefined();
  });
});

describe('varianceTone', () => {
  it('treats a positive variance as favorable by default', () => {
    expect(varianceTone(10, row())).toBe('favorable');
    expect(varianceTone(-10, row())).toBe('unfavorable');
  });

  it('inverts for rows where lower is better', () => {
    expect(varianceTone(10, row({ favorable: 'lower' }))).toBe('unfavorable');
    expect(varianceTone(-10, row({ favorable: 'lower' }))).toBe('favorable');
  });

  it('has no tone for zero, empty or non-numeric values', () => {
    expect(varianceTone(0, row())).toBeNull();
    expect(varianceTone(null, row())).toBeNull();
    expect(varianceTone('n/a', row())).toBeNull();
  });
});
