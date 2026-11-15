/**
 * @file Public contracts of the grid: rows, columns, cells, formatting,
 * filters and sorting. Framework-free — nothing in grid-core imports
 * Angular.
 */

/** Stable identity of a row. */
export type GridRowId = string | number;

/** A raw cell value. Amounts may be numbers or decimal strings. */
export type GridCellValue = number | string | boolean | null | undefined;

/** Visual role of a row. The grid styles it; it never computes it. */
export type GridRowKind = 'data' | 'subtotal' | 'total';

/** One row, as supplied by the app. `T` is the app's record type. */
export interface GridRow<T = unknown> {
  id: GridRowId;
  /** Id of the parent row. Omit (or null) for a root row. */
  parentId?: GridRowId | null;
  /** The app's record. Cells read from it by `field` or `valueGetter`. */
  data: T;
  /**
   * The row has children that are not loaded yet. Expanding it emits an
   * event; the app loads the children and passes them in.
   */
  hasChildren?: boolean;
  /** Visual treatment only: the grid never computes totals. */
  kind?: GridRowKind;
  /** Which direction of a variance is good news for this row. */
  favorable?: 'higher' | 'lower';
  /** Number format for the whole row, e.g. a percentage line. */
  format?: GridNumberFormat;
  /**
   * Absolute position, for flat data paged by scroll: the app supplies
   * the rows of the windows it has loaded and tells the grid where each
   * one sits within `rowCount`.
   */
  index?: number;
}

/** One entry of the list the renderer draws, top to bottom. */
export type GridVisibleRow<T = unknown> =
  | {
      kind: 'row';
      row: GridRow<T>;
      /** Depth in the tree, 1-based. */
      level: number;
      hasChildren: boolean;
      expanded: boolean;
      /** Kept only as context for a matching descendant while filtering. */
      dimmed: boolean;
    }
  | {
      /** A row the grid knows exists (`rowCount`) but has not been given. */
      kind: 'placeholder';
      index: number;
    };

/** Side a column is pinned to. */
export type GridColumnPin = 'left' | 'right';
/** Kind of value a column holds; drives alignment and comparison. */
export type GridColumnType = 'text' | 'number';
/** Filter editors a column can offer. */
export type GridFilterType = 'text' | 'number' | 'set' | 'custom';

/** A leaf column. */
export interface GridColumn<T = unknown> {
  id: string;
  header: string;
  /**
   * Shows the hierarchy: indentation per level and the expand/collapse
   * toggle. Usually the name column.
   */
  tree?: boolean;
  /** Key of `row.data` to read. Defaults to the column id. */
  field?: string;
  /** Takes precedence over `field`. */
  valueGetter?: (row: GridRow<T>) => GridCellValue;
  type?: GridColumnType;
  /** Width in px. */
  width?: number;
  minWidth?: number;
  /** Whether the user can drag the column's edge to resize it. Defaults to true. */
  resizable?: boolean;
  /** Leaves the column out of the grid without removing it from the column tree. */
  hidden?: boolean;
  pinned?: GridColumnPin;
  format?: GridNumberFormat;
  /** Color the value by the row's `favorable` direction. */
  variance?: boolean;
  editable?: boolean;
  sortable?: boolean;
  /** Filter offered in the header. */
  filter?: GridFilterType;
}

/** A header group spanning its child columns, e.g. a quarter over its months. */
export interface GridColumnGroup<T = unknown> {
  id: string;
  header: string;
  children: GridColumnNode<T>[];
}

/** A node of the column tree. */
export type GridColumnNode<T = unknown> = GridColumn<T> | GridColumnGroup<T>;

/** Type guard: whether a column node is a group rather than a leaf. */
export function isColumnGroup<T>(node: GridColumnNode<T>): node is GridColumnGroup<T> {
  return Array.isArray((node as GridColumnGroup<T>).children);
}

/** Identifies a cell by row and column id. */
export interface GridCellRef {
  rowId: GridRowId;
  columnId: string;
}

/** A position in the visible grid: row and leaf-column indexes. */
export interface GridCellPosition {
  row: number;
  col: number;
}

/** Inclusive on both ends. `start` is the anchor, `end` the moving corner. */
export interface GridCellRange {
  start: GridCellPosition;
  end: GridCellPosition;
}

/**
 * One edit. The grid emits these in batches and never writes to rows:
 * the app applies them (with whatever rules it has) and passes data back.
 */
export interface GridCellChange {
  rowId: GridRowId;
  columnId: string;
  previous: GridCellValue;
  next: GridCellValue;
}

/**
 * The cells a user selected. Positions are display positions, which
 * move with sorting, filtering and expansion; the ids do not.
 */
export interface GridSelection {
  range: GridCellRange;
  /** Ids of the loaded rows in the range, top to bottom. */
  rowIds: GridRowId[];
  /** Ids of the columns in the range, left to right. */
  columnIds: string[];
}

/** A pasted value that did not become a change. */
export interface GridCellRejection {
  rowId: GridRowId;
  columnId: string;
  /** The text that was pasted. */
  text: string;
  /** `readonly`: the cell does not accept edits. `invalid`: the text is not a value for the column. */
  reason: 'readonly' | 'invalid';
}

/** Per-cell state, resolved by the app. */
export interface GridCellState {
  readonly?: boolean;
  /** Closed for input. */
  locked?: boolean;
  /** Produced by the app's calculations; not directly editable. */
  calculated?: boolean;
  /** Changed and not yet saved. */
  dirty?: boolean;
  /** Message shown and announced when set. */
  invalid?: string | boolean;
  /** Save in flight. */
  pending?: boolean;
  /** The cell has a note; the app shows it on request. */
  note?: boolean;
}

/** Declarative number format. All options are display-only. */
export interface GridNumberFormat {
  style?: 'number' | 'percent';
  decimals?: number;
  /** Divide before display: 1000 shows thousands, 1000000 millions. */
  scale?: number;
  /** `parentheses` shows negatives as (1,234). */
  negative?: 'minus' | 'parentheses';
  /** Text for a zero value, commonly '–'. */
  zero?: string;
  /** Flip the sign for display only, e.g. a value stored negative but read as positive. */
  reverseSign?: boolean;
}

/** Operators of the text filter. */
export type GridTextOperator = 'contains' | 'startsWith' | 'equals' | 'empty';
/** Operators of the number filter. */
export type GridNumberOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'empty';

/** Filter on the text of a value, ignoring case. */
export interface GridTextFilter {
  type: 'text';
  operator: GridTextOperator;
  value?: string;
}

/** Filter on the raw numeric value. */
export interface GridNumberFilter {
  type: 'number';
  operator: GridNumberOperator;
  value?: number;
  /** Upper bound for `between` (inclusive). */
  to?: number;
}

/** Filter that keeps a chosen set of values. */
export interface GridSetFilter {
  type: 'set';
  /** Raw values to keep. */
  values: GridCellValue[];
}

/** Filter whose logic is supplied by the app. */
export interface GridCustomFilter<T = unknown> {
  type: 'custom';
  predicate: (value: GridCellValue, row: GridRow<T>) => boolean;
}

/** Any filter a column can hold. */
export type GridFilter<T = unknown> =
  | GridTextFilter
  | GridNumberFilter
  | GridSetFilter
  | GridCustomFilter<T>;

/** Active filters by column id. */
export type GridFilters<T = unknown> = Record<string, GridFilter<T>>;

/** One sort entry. */
export interface GridSort {
  columnId: string;
  direction: 'asc' | 'desc';
}
