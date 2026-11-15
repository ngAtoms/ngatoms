/**
 * @file Reading raw cell values and interpreting them as empty or numeric.
 * Shared by filtering, sorting and formatting so they agree on what a
 * value means.
 */

import { GridCellValue, GridColumn, GridRow } from './types';

/**
 * Reads the raw value of a cell.
 * Resolution order: `column.valueGetter`, then `column.field`, then the
 * column id used as a key of `row.data`.
 */
export function getCellValue<T>(row: GridRow<T>, column: GridColumn<T>): GridCellValue {
  if (column.valueGetter) return column.valueGetter(row);
  const record = row.data as Record<string, GridCellValue> | null | undefined;
  return record?.[column.field ?? column.id];
}

/** Whether a value counts as "no value": null, undefined or an empty string. */
export function isEmptyValue(value: GridCellValue): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

/**
 * Numeric reading of a cell value.
 * Decimal strings such as `"1234.50"` count as numbers, so amounts kept as
 * strings for precision still filter, sort and format as numbers.
 *
 * @returns The number, or null when the value is empty or not numeric.
 */
export function toNumber(value: GridCellValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
