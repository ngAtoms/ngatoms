/**
 * @file Column model: turns the column tree the app declares into what a
 * renderer needs — leaf columns split into panes, pixel offsets per pane,
 * and header rows with spans.
 */

import { GridColumn, GridColumnGroup, GridColumnNode, GridColumnPin, isColumnGroup } from './types';
import { buildOffsets } from './viewport';

/** The three horizontal regions of the grid. */
export type GridPaneId = 'left' | 'center' | 'right';

export const DEFAULT_COLUMN_WIDTH = 120;
export const DEFAULT_MIN_COLUMN_WIDTH = 48;

/** One cell of the column header: a group or a leaf column. */
export interface GridHeaderCell<T = unknown> {
  /** Unique within its pane. A group split by pinning repeats in each pane. */
  key: string;
  header: string;
  /** Header row, 0-based from the top. */
  row: number;
  rowSpan: number;
  /** Index of the first leaf it covers, within the pane. */
  colStart: number;
  colSpan: number;
  /** Set for leaf headers; groups have none. */
  column?: GridColumn<T>;
}

/** The columns of one pane and their geometry. */
export interface GridColumnPane<T = unknown> {
  id: GridPaneId;
  columns: GridColumn<T>[];
  /** Prefix sums of the column widths (length = columns + 1). */
  offsets: Float64Array;
  width: number;
  /** One array per header row. */
  headerRows: GridHeaderCell<T>[][];
}

/** Everything derived from the column tree. */
export interface GridColumnModel<T = unknown> {
  /** All leaves in display order: left pane, center, right pane. */
  columns: GridColumn<T>[];
  /** Position of each column id within `columns`. */
  indexById: Map<string, number>;
  panes: Record<GridPaneId, GridColumnPane<T>>;
  /** Number of header rows: deepest group nesting + 1. */
  headerDepth: number;
}

/** A leaf column together with its ancestor groups, outermost first. */
interface Leaf<T> {
  column: GridColumn<T>;
  path: GridColumnGroup<T>[];
}

/**
 * Resolves the width of a column in px.
 * A user-resized width wins over the declared one, and the result never
 * goes below the column's minimum.
 */
export function columnWidth<T>(column: GridColumn<T>, widths?: ReadonlyMap<string, number>): number {
  const min = column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  return Math.max(min, widths?.get(column.id) ?? column.width ?? DEFAULT_COLUMN_WIDTH);
}

/** Collects the leaves of a column tree depth-first, recording each leaf's groups. */
function collectLeaves<T>(nodes: GridColumnNode<T>[], path: GridColumnGroup<T>[], out: Leaf<T>[]): void {
  for (const node of nodes) {
    if (isColumnGroup(node)) collectLeaves(node.children, [...path, node], out);
    else out.push({ column: node, path });
  }
}

/**
 * Adds a group's header cell for the leaf at `col`.
 * Consecutive leaves of the same group extend one cell instead of
 * creating a new one, which is what produces the column span.
 */
function addGroupCell<T>(cells: GridHeaderCell<T>[], group: GridColumnGroup<T>, row: number, col: number): void {
  const previous = cells[cells.length - 1];
  const continuesPrevious =
    !!previous && !previous.column && previous.key === group.id && previous.colStart + previous.colSpan === col;
  if (continuesPrevious) previous.colSpan++;
  else cells.push({ key: group.id, header: group.header, row, rowSpan: 1, colStart: col, colSpan: 1 });
}

/**
 * Builds the header rows of one pane.
 * A leaf header fills every row left below its groups, so a column under
 * a shallower group still reaches the bottom header row.
 */
function buildHeaderRows<T>(leaves: Leaf<T>[], depth: number): GridHeaderCell<T>[][] {
  const rows: GridHeaderCell<T>[][] = Array.from({ length: depth }, () => []);

  leaves.forEach((leaf, col) => {
    leaf.path.forEach((group, row) => addGroupCell(rows[row], group, row, col));

    const row = leaf.path.length;
    rows[row].push({
      key: leaf.column.id,
      header: leaf.column.header,
      row,
      rowSpan: depth - row,
      colStart: col,
      colSpan: 1,
      column: leaf.column,
    });
  });

  return rows;
}

/** Builds one pane from its leaves. */
function buildPane<T>(
  id: GridPaneId,
  leaves: Leaf<T>[],
  headerDepth: number,
  widths?: ReadonlyMap<string, number>,
): GridColumnPane<T> {
  const columns = leaves.map(leaf => leaf.column);
  const offsets = buildOffsets(columns.map(column => columnWidth(column, widths)));
  return {
    id,
    columns,
    offsets,
    width: offsets[columns.length],
    headerRows: buildHeaderRows(leaves, headerDepth),
  };
}

/**
 * Builds the column model from the column tree.
 *
 * @param nodes Column groups and leaf columns, as declared by the app.
 * @param widths User-resized widths by column id; they win over `column.width`.
 */
export function buildColumnModel<T>(
  nodes: GridColumnNode<T>[],
  widths?: ReadonlyMap<string, number>,
): GridColumnModel<T> {
  const leaves: Leaf<T>[] = [];
  collectLeaves(nodes, [], leaves);

  const headerDepth = leaves.reduce((max, leaf) => Math.max(max, leaf.path.length), 0) + 1;

  /** Leaves pinned to the given side; `undefined` selects the unpinned ones. */
  const pinnedTo = (pin: GridColumnPin | undefined): Leaf<T>[] => leaves.filter(leaf => leaf.column.pinned === pin);

  const panes: Record<GridPaneId, GridColumnPane<T>> = {
    left: buildPane('left', pinnedTo('left'), headerDepth, widths),
    center: buildPane('center', pinnedTo(undefined), headerDepth, widths),
    right: buildPane('right', pinnedTo('right'), headerDepth, widths),
  };

  const columns = [...panes.left.columns, ...panes.center.columns, ...panes.right.columns];
  const indexById = new Map(columns.map((column, index) => [column.id, index]));

  return { columns, indexById, panes, headerDepth };
}

/** Share of the viewport width that pinned columns may cover before they are released. */
export const MAX_PINNED_SHARE = 0.6;

/** Returns the column tree with the pins on the given sides removed. */
export function unpinColumns<T>(nodes: GridColumnNode<T>[], sides: ReadonlySet<GridColumnPin>): GridColumnNode<T>[] {
  return nodes.map(node => {
    if (isColumnGroup(node)) return { ...node, children: unpinColumns(node.children, sides) };
    return node.pinned && sides.has(node.pinned) ? { ...node, pinned: undefined } : node;
  });
}

/**
 * Builds the column model for a viewport of the given width.
 *
 * Pinned columns that would cover more than {@link MAX_PINNED_SHARE} of the
 * viewport are released, so a narrow container always keeps room to scroll:
 * the right side goes first, and the left side too when it alone is too wide.
 *
 * @param nodes Column groups and leaf columns, as declared by the app.
 * @param viewportWidth Width of the scroll viewport in px; `0` means not measured yet.
 * @param widths User-resized widths by column id.
 */
export function fitColumnModel<T>(
  nodes: GridColumnNode<T>[],
  viewportWidth: number,
  widths?: ReadonlyMap<string, number>,
): GridColumnModel<T> {
  const model = buildColumnModel(nodes, widths);
  const { left, right } = model.panes;
  const budget = viewportWidth * MAX_PINNED_SHARE;
  if (viewportWidth <= 0 || left.width + right.width <= budget) return model;

  const released: GridColumnPin[] = left.width <= budget ? ['right'] : ['left', 'right'];
  return buildColumnModel(unpinColumns(nodes, new Set(released)), widths);
}
