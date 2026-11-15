/**
 * @file Cell editing: converts between the raw value of a cell and the
 * text a user types, and builds the change the grid emits. The grid never
 * writes to rows — a change is a proposal the app applies.
 */

import { GridCellChange, GridCellState, GridCellValue, GridColumn, GridNumberFormat, GridRow } from './types';
import { getCellValue, isEmptyValue, toNumber } from './value';

/** Result of reading what the user typed. */
export type GridParseResult = { valid: true; value: GridCellValue } | { valid: false };

/** Decimal and grouping separators of a locale. */
interface LocaleSeparators {
  decimal: string;
  group: string;
}

/** Factor between a stored fraction and the percentage a user reads and types. */
const PERCENT_FACTOR = 100;

/** Digits a double represents exactly; rounding to them removes float noise. */
const SIGNIFICANT_DIGITS = 15;

/** Reads the separators a locale uses, from a sample formatted by `Intl`. */
function separatorsOf(locale: string | undefined): LocaleSeparators {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find(part => part.type === 'decimal')?.value ?? '.',
    group: parts.find(part => part.type === 'group')?.value ?? ',',
  };
}

/**
 * Factor between a raw value and the number shown for it.
 * Combines percent display, scaling and sign reversal, so that
 * `shown = raw * factor` and `raw = typed / factor`.
 */
function displayFactor(format: GridNumberFormat | undefined): number {
  const percent = format?.style === 'percent' ? PERCENT_FACTOR : 1;
  const scale = format?.scale ? 1 / format.scale : 1;
  const sign = format?.reverseSign ? -1 : 1;
  return percent * scale * sign;
}

/** Drops the rounding noise that binary floating point adds to decimal arithmetic. */
function withoutFloatNoise(value: number): number {
  return Number(value.toPrecision(SIGNIFICANT_DIGITS));
}

/**
 * Parses a number as a user types or pastes it.
 * Accepts the locale's separators, a leading minus, parentheses for
 * negatives, and a trailing percent sign.
 *
 * @returns The number, or null when the text is not a number.
 */
export function parseLocalizedNumber(text: string, locale?: string): number | null {
  const { decimal, group } = separatorsOf(locale);
  let body = text.trim();
  if (!body) return null;

  const inParentheses = body.startsWith('(') && body.endsWith(')');
  if (inParentheses) body = body.slice(1, -1);
  const isPercent = body.endsWith('%');
  if (isPercent) body = body.slice(0, -1);

  const normalized = body
    .replace(/\s/g, '')
    .split(group).join('')
    .replace(decimal, '.')
    .replace(/^[−–]/, '-');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;

  const magnitude = Number(normalized);
  const signed = inParentheses ? -Math.abs(magnitude) : magnitude;
  return isPercent ? signed / PERCENT_FACTOR : signed;
}

/**
 * Turns typed text into a raw cell value.
 * In a number column the text is read in display units and converted
 * back: typing `12` into a percent cell stores `0.12`, and typing `5`
 * into a cell scaled to thousands stores `5000`. A typed percent sign
 * always means a fraction. Empty text clears the cell.
 */
export function parseCellInput<T>(
  text: string,
  column: GridColumn<T>,
  format: GridNumberFormat | undefined,
  locale?: string,
): GridParseResult {
  if (!text.trim()) return { valid: true, value: null };
  if (column.type !== 'number') return { valid: true, value: text };

  const parsed = parseLocalizedNumber(text, locale);
  if (parsed === null) return { valid: false };

  const typedPercent = /%\)?$/.test(text.trim());
  const factor = displayFactor(typedPercent ? { ...format, style: 'number' } : format);
  return { valid: true, value: withoutFloatNoise(parsed / factor) };
}

/**
 * Text an editor starts with for a cell.
 * Numbers are shown in display units, ungrouped and with the locale's
 * decimal separator, so what the user sees is what they would type.
 */
export function editTextOf(value: GridCellValue, format: GridNumberFormat | undefined, locale?: string): string {
  if (isEmptyValue(value)) return '';
  const raw = toNumber(value);
  if (raw === null || typeof value === 'boolean') return String(value);

  const shown = withoutFloatNoise(raw * displayFactor(format));
  return String(shown).replace('.', separatorsOf(locale).decimal);
}

/** Whether two raw values are the same for the purpose of an edit. */
function isSameValue(a: GridCellValue, b: GridCellValue): boolean {
  if (isEmptyValue(a) && isEmptyValue(b)) return true;
  const x = toNumber(a);
  const y = toNumber(b);
  if (x !== null && y !== null && typeof a !== 'boolean' && typeof b !== 'boolean') return x === y;
  return a === b;
}

/**
 * Builds the change for a cell, or null when the value did not change.
 */
export function createCellChange<T>(row: GridRow<T>, column: GridColumn<T>, next: GridCellValue): GridCellChange | null {
  const previous = getCellValue(row, column);
  if (isSameValue(previous, next)) return null;
  return { rowId: row.id, columnId: column.id, previous, next };
}

/**
 * Whether a cell accepts edits.
 * The column must be editable, and the cell must not be read-only,
 * locked, calculated or waiting on a save.
 */
export function isCellEditable<T>(column: GridColumn<T>, state: GridCellState | null | undefined): boolean {
  if (!column.editable) return false;
  return !(state?.readonly || state?.locked || state?.calculated || state?.pending);
}
