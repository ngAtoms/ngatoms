/**
 * @file Specs for cell editing: parsing typed text, editor text and change building.
 */

import { describe, expect, it } from 'vitest';
import { createCellChange, editTextOf, isCellEditable, parseCellInput, parseLocalizedNumber } from './edit';
import { GridColumn, GridRow } from './types';

const numberColumn: GridColumn = { id: 'units', header: 'Units', type: 'number', editable: true };
const textColumn: GridColumn = { id: 'name', header: 'Name', editable: true };
const row: GridRow = { id: 'r1', data: { units: 120, name: 'Desk' } };

describe('parseLocalizedNumber', () => {
  it('reads plain and grouped numbers', () => {
    expect(parseLocalizedNumber('1234.5', 'en-US')).toBe(1234.5);
    expect(parseLocalizedNumber('1,234,567.89', 'en-US')).toBe(1234567.89);
    expect(parseLocalizedNumber(' 42 ', 'en-US')).toBe(42);
    expect(parseLocalizedNumber('.5', 'en-US')).toBe(0.5);
  });

  it('follows the separators of the locale', () => {
    expect(parseLocalizedNumber('1.234,5', 'de-DE')).toBe(1234.5);
    expect(parseLocalizedNumber('1 234,5', 'pt-PT')).toBe(1234.5);
  });

  it('reads negatives written with a minus or in parentheses', () => {
    expect(parseLocalizedNumber('-1,234', 'en-US')).toBe(-1234);
    expect(parseLocalizedNumber('(1,234)', 'en-US')).toBe(-1234);
    expect(parseLocalizedNumber('−5', 'en-US')).toBe(-5);
  });

  it('reads percentages as fractions', () => {
    expect(parseLocalizedNumber('12.5%', 'en-US')).toBe(0.125);
    expect(parseLocalizedNumber('(5%)', 'en-US')).toBe(-0.05);
  });

  it('rejects text that is not a number', () => {
    expect(parseLocalizedNumber('abc', 'en-US')).toBeNull();
    expect(parseLocalizedNumber('12abc', 'en-US')).toBeNull();
    expect(parseLocalizedNumber('1.2.3', 'en-US')).toBeNull();
    expect(parseLocalizedNumber('', 'en-US')).toBeNull();
    expect(parseLocalizedNumber('-', 'en-US')).toBeNull();
  });
});

describe('parseCellInput', () => {
  it('parses numbers in a number column', () => {
    expect(parseCellInput('1,500', numberColumn, undefined, 'en-US')).toEqual({ valid: true, value: 1500 });
  });

  it('keeps text as typed in a text column', () => {
    expect(parseCellInput('Standing desk', textColumn, undefined, 'en-US')).toEqual({ valid: true, value: 'Standing desk' });
  });

  it('clears the cell on empty text', () => {
    expect(parseCellInput('  ', numberColumn, undefined, 'en-US')).toEqual({ valid: true, value: null });
  });

  it('flags text that is not a number in a number column', () => {
    expect(parseCellInput('lots', numberColumn, undefined, 'en-US')).toEqual({ valid: false });
  });

  it('reads display units back into raw values', () => {
    expect(parseCellInput('5', numberColumn, { scale: 1000 }, 'en-US')).toEqual({ valid: true, value: 5000 });
    expect(parseCellInput('5', numberColumn, { reverseSign: true }, 'en-US')).toEqual({ valid: true, value: -5 });
    expect(parseCellInput('12', numberColumn, { style: 'percent' }, 'en-US')).toEqual({ valid: true, value: 0.12 });
    expect(parseCellInput('12%', numberColumn, { style: 'percent' }, 'en-US')).toEqual({ valid: true, value: 0.12 });
  });

  it('treats a typed percent sign as a fraction in a plain number cell', () => {
    expect(parseCellInput('50%', numberColumn, undefined, 'en-US')).toEqual({ valid: true, value: 0.5 });
  });
});

describe('editTextOf', () => {
  it('shows numbers ungrouped, with the locale decimal separator', () => {
    expect(editTextOf(1234567.5, undefined, 'en-US')).toBe('1234567.5');
    expect(editTextOf(1234.5, undefined, 'pt-PT')).toBe('1234,5');
  });

  it('shows display units', () => {
    expect(editTextOf(5000, { scale: 1000 }, 'en-US')).toBe('5');
    expect(editTextOf(0.125, { style: 'percent' }, 'en-US')).toBe('12.5');
    expect(editTextOf(-40, { reverseSign: true }, 'en-US')).toBe('40');
  });

  it('avoids floating-point noise', () => {
    expect(editTextOf(0.07, { style: 'percent' }, 'en-US')).toBe('7');
  });

  it('round-trips through parseCellInput', () => {
    const format = { style: 'percent' as const, scale: undefined };
    const text = editTextOf(0.333, format, 'en-US');
    expect(parseCellInput(text, numberColumn, format, 'en-US')).toEqual({ valid: true, value: 0.333 });
  });

  it('shows text as is and nothing for empty values', () => {
    expect(editTextOf('Desk', undefined, 'en-US')).toBe('Desk');
    expect(editTextOf(null, undefined, 'en-US')).toBe('');
  });
});

describe('createCellChange', () => {
  it('describes the change with previous and next values', () => {
    expect(createCellChange(row, numberColumn, 150)).toEqual({ rowId: 'r1', columnId: 'units', previous: 120, next: 150 });
  });

  it('returns null when nothing changed', () => {
    expect(createCellChange(row, numberColumn, 120)).toBeNull();
    expect(createCellChange(row, numberColumn, '120')).toBeNull();
    expect(createCellChange({ id: 'r2', data: {} }, numberColumn, null)).toBeNull();
  });

  it('reports clearing a cell', () => {
    expect(createCellChange(row, numberColumn, null)).toMatchObject({ previous: 120, next: null });
  });
});

describe('isCellEditable', () => {
  it('requires an editable column', () => {
    expect(isCellEditable(numberColumn, null)).toBe(true);
    expect(isCellEditable({ id: 'x', header: 'X' }, null)).toBe(false);
  });

  it('blocks read-only, locked, calculated and pending cells', () => {
    expect(isCellEditable(numberColumn, { readonly: true })).toBe(false);
    expect(isCellEditable(numberColumn, { locked: true })).toBe(false);
    expect(isCellEditable(numberColumn, { calculated: true })).toBe(false);
    expect(isCellEditable(numberColumn, { pending: true })).toBe(false);
  });

  it('allows dirty, invalid and annotated cells', () => {
    expect(isCellEditable(numberColumn, { dirty: true, invalid: 'Too high', note: true })).toBe(true);
  });
});
