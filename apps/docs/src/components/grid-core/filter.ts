/**
 * @file Column filters: turns filter state into predicates over raw cell
 * values and applies them to the row tree. Filtering never changes a
 * value — a parent keeps the total it was given even when some of its
 * children are filtered out.
 */

import { GridRowTree, ancestorsOf } from './row-model';
import {
  GridCellValue,
  GridColumn,
  GridFilter,
  GridFilters,
  GridNumberFilter,
  GridRow,
  GridRowId,
  GridTextFilter,
} from './types';
import { getCellValue, isEmptyValue, toNumber } from './value';

/** Outcome of applying the active filters to the row tree. */
export interface GridFilterResult {
  /** Rows that pass every active filter. */
  matched: Set<GridRowId>;
  /** `matched` plus their ancestors, kept so matches stay in context. */
  visible: Set<GridRowId>;
}

/** Tests one cell value. */
type Predicate<T> = (value: GridCellValue, row: GridRow<T>) => boolean;

/** A column paired with the predicate of its filter. */
interface ColumnTest<T> {
  column: GridColumn<T>;
  test: Predicate<T>;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Whether a filter bound is a usable number. */
function isBound(bound: number | undefined): bound is number {
  return typeof bound === 'number' && Number.isFinite(bound);
}

/**
 * Whether a filter actually filters.
 * A filter the user opened but did not fill in must not hide every row.
 */
export function isFilterActive<T>(filter: GridFilter<T> | null | undefined): boolean {
  if (!filter) return false;
  switch (filter.type) {
    case 'text':
      return filter.operator === 'empty' || !!filter.value;
    case 'number':
      if (filter.operator === 'empty') return true;
      if (filter.operator === 'between') return isBound(filter.value) || isBound(filter.to);
      return isBound(filter.value);
    case 'set':
    case 'custom':
      return true;
  }
}

/** Builds the predicate of a text filter. Matching ignores case. */
function textPredicate(filter: GridTextFilter): Predicate<unknown> {
  if (filter.operator === 'empty') return isEmptyValue;
  const needle = (filter.value ?? '').toLocaleLowerCase();
  return value => {
    if (isEmptyValue(value)) return false;
    const text = String(value).toLocaleLowerCase();
    switch (filter.operator) {
      case 'startsWith': return text.startsWith(needle);
      case 'equals':     return text === needle;
      default:           return text.includes(needle);
    }
  };
}

/**
 * Builds the predicate of a number filter.
 * Values are compared raw, never as formatted text. `between` is
 * inclusive, and a missing bound leaves that side open.
 */
function numberPredicate(filter: GridNumberFilter): Predicate<unknown> {
  if (filter.operator === 'empty') return isEmptyValue;
  const from = filter.value;
  const to = filter.to;
  const operand = from ?? Number.NaN;
  return value => {
    const n = toNumber(value);
    if (n === null) return false;
    switch (filter.operator) {
      case 'eq':      return n === operand;
      case 'ne':      return n !== operand;
      case 'gt':      return n > operand;
      case 'gte':     return n >= operand;
      case 'lt':      return n < operand;
      case 'lte':     return n <= operand;
      case 'between': return (!isBound(from) || n >= from) && (!isBound(to) || n <= to);
      default:        return true;
    }
  };
}

/** Normalizes a value for set membership: every kind of empty becomes null. */
function setKey(value: GridCellValue): GridCellValue {
  return isEmptyValue(value) ? null : value;
}

/** Builds the predicate for any filter type. */
export function createFilterPredicate<T>(filter: GridFilter<T>): Predicate<T> {
  switch (filter.type) {
    case 'text':
      return textPredicate(filter);
    case 'number':
      return numberPredicate(filter);
    case 'set': {
      const allowed = new Set(filter.values.map(setKey));
      return value => allowed.has(setKey(value));
    }
    case 'custom':
      return filter.predicate;
  }
}

/** Pairs each active filter with its column, skipping unknown columns. */
function buildColumnTests<T>(
  filters: GridFilters<T> | null | undefined,
  columns: ReadonlyMap<string, GridColumn<T>>,
): ColumnTest<T>[] {
  const tests: ColumnTest<T>[] = [];
  for (const [columnId, filter] of Object.entries(filters ?? {})) {
    const column = columns.get(columnId);
    if (column && isFilterActive(filter)) tests.push({ column, test: createFilterPredicate(filter) });
  }
  return tests;
}

/**
 * Marks a row's ancestors as visible.
 * Stops at the first ancestor already marked: everything above it was
 * marked when that ancestor was.
 */
function revealAncestors<T>(tree: GridRowTree<T>, id: GridRowId, visible: Set<GridRowId>): void {
  for (const ancestor of ancestorsOf(tree, id)) {
    if (visible.has(ancestor)) return;
    visible.add(ancestor);
  }
}

/**
 * Applies the active filters to every row.
 * A row matches when it passes all of them; its ancestors stay visible as
 * context.
 *
 * @param tree The row tree.
 * @param filters Filter state by column id.
 * @param columns Leaf columns by id.
 * @returns The matching and visible rows, or null when no filter is
 * active, so callers can skip the filtered path entirely.
 */
export function applyFilters<T>(
  tree: GridRowTree<T>,
  filters: GridFilters<T> | null | undefined,
  columns: ReadonlyMap<string, GridColumn<T>>,
): GridFilterResult | null {
  const tests = buildColumnTests(filters, columns);
  if (!tests.length) return null;

  const matched = new Set<GridRowId>();
  const visible = new Set<GridRowId>();

  for (const row of tree.byId.values()) {
    const passes = tests.every(({ column, test }) => test(getCellValue(row, column), row));
    if (!passes) continue;
    matched.add(row.id);
    visible.add(row.id);
    revealAncestors(tree, row.id, visible);
  }

  return { matched, visible };
}

/** Orders set-filter entries: the empty entry first, then numbers or text ascending. */
function compareDistinct(a: GridCellValue, b: GridCellValue): number {
  if (a === null) return b === null ? 0 : -1;
  if (b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

/**
 * Lists the distinct raw values of a column, for the set filter.
 * Empty values collapse into a single null entry, listed first.
 */
export function distinctValues<T>(rows: Iterable<GridRow<T>>, column: GridColumn<T>): GridCellValue[] {
  const seen = new Set<GridCellValue>();
  for (const row of rows) seen.add(setKey(getCellValue(row, column)));
  return [...seen].sort(compareDistinct);
}
