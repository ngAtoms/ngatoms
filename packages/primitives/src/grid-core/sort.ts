/**
 * @file Sorting: builds row comparators from the sort state and steps the
 * state when a header is clicked. Applied among siblings by the row model,
 * so the shape of the tree never changes.
 */

import { GridCellValue, GridColumn, GridRow, GridSort } from './types';
import { getCellValue, isEmptyValue, toNumber } from './value';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** A sort entry resolved to its column, with the direction as a multiplier. */
interface SortKey<T> {
  column: GridColumn<T>;
  sign: 1 | -1;
}

/**
 * Compares two non-empty values in ascending order.
 * Numbers (and decimal strings, in a number column) compare numerically;
 * text compares with a locale-aware, digit-aware collator. Non-numeric
 * text found in a number column goes after the numbers.
 */
function compareValues(a: GridCellValue, b: GridCellValue, numeric: boolean): number {
  if (numeric || (typeof a === 'number' && typeof b === 'number')) {
    const x = toNumber(a);
    const y = toNumber(b);
    if (x !== null && y !== null) return x - y;
    if (x !== null) return -1;
    if (y !== null) return 1;
  }
  return collator.compare(String(a), String(b));
}

/**
 * Compares two rows on one sort key.
 * Empty values go last in both directions: reversing the order should not
 * bring a block of blanks to the top.
 */
function compareByKey<T>(a: GridRow<T>, b: GridRow<T>, key: SortKey<T>): number {
  const x = getCellValue(a, key.column);
  const y = getCellValue(b, key.column);
  const xEmpty = isEmptyValue(x);
  const yEmpty = isEmptyValue(y);
  if (xEmpty && yEmpty) return 0;
  if (xEmpty) return 1;
  if (yEmpty) return -1;
  return compareValues(x, y, key.column.type === 'number') * key.sign;
}

/**
 * Builds a row comparator from the sort state.
 *
 * @param sort Sort entries in priority order. Unknown columns are ignored.
 * @param columns Leaf columns by id.
 * @returns The comparator, or null when nothing is sorted.
 */
export function createRowComparator<T>(
  sort: readonly GridSort[] | null | undefined,
  columns: ReadonlyMap<string, GridColumn<T>>,
): ((a: GridRow<T>, b: GridRow<T>) => number) | null {
  const keys: SortKey<T>[] = [];
  for (const entry of sort ?? []) {
    const column = columns.get(entry.columnId);
    if (column) keys.push({ column, sign: entry.direction === 'desc' ? -1 : 1 });
  }
  if (!keys.length) return null;

  return (a, b) => {
    for (const key of keys) {
      const result = compareByKey(a, b, key);
      if (result !== 0) return result;
    }
    return 0;
  };
}

/**
 * Computes the sort state after a click on a column header.
 * The column cycles ascending → descending → unsorted, and replaces any
 * sort on another column.
 */
export function nextSort(sort: readonly GridSort[] | null | undefined, columnId: string): GridSort[] {
  const current = (sort ?? []).find(entry => entry.columnId === columnId);
  if (!current) return [{ columnId, direction: 'asc' }];
  if (current.direction === 'asc') return [{ columnId, direction: 'desc' }];
  return [];
}
