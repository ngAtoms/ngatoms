/**
 * @file Active-cell navigation and range selection: where a keyboard move
 * lands, and which cells a range covers. Pure position math — focus and
 * scrolling are the renderer's concern.
 */

import { GridCellPosition, GridCellRange } from './types';

/** A keyboard move of the active cell. */
export type GridMove =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'rowStart'
  | 'rowEnd'
  | 'gridStart'
  | 'gridEnd'
  | 'pageUp'
  | 'pageDown';

/** Extent of the grid a move must stay within. */
export interface GridBounds {
  rowCount: number;
  columnCount: number;
  /** Rows a page move travels; usually the number of rows on screen. */
  pageSize: number;
}

/** Restricts a number to the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Keeps a position inside the grid.
 *
 * @returns The clamped position, or null when the grid has no cells.
 */
export function clampPosition(position: GridCellPosition, bounds: GridBounds): GridCellPosition | null {
  if (bounds.rowCount <= 0 || bounds.columnCount <= 0) return null;
  return {
    row: clamp(position.row, 0, bounds.rowCount - 1),
    col: clamp(position.col, 0, bounds.columnCount - 1),
  };
}

/**
 * Computes where a move takes the active cell.
 * Moves stop at the edges of the grid; they never wrap.
 *
 * @returns The new position, or null when the grid has no cells.
 */
export function movePosition(position: GridCellPosition, move: GridMove, bounds: GridBounds): GridCellPosition | null {
  const { row, col } = position;
  const lastRow = bounds.rowCount - 1;
  const lastCol = bounds.columnCount - 1;
  const page = Math.max(1, bounds.pageSize);

  const targets: Record<GridMove, GridCellPosition> = {
    up: { row: row - 1, col },
    down: { row: row + 1, col },
    left: { row, col: col - 1 },
    right: { row, col: col + 1 },
    rowStart: { row, col: 0 },
    rowEnd: { row, col: lastCol },
    gridStart: { row: 0, col: 0 },
    gridEnd: { row: lastRow, col: lastCol },
    pageUp: { row: row - page, col },
    pageDown: { row: row + page, col },
  };
  return clampPosition(targets[move], bounds);
}

/**
 * Maps a keyboard event to a move.
 * Follows the WAI-ARIA grid pattern: Home and End travel the row, and
 * with Ctrl (or Cmd) they travel the whole grid.
 *
 * @returns The move, or null when the key is not a navigation key.
 */
export function moveForKey(key: string, withCtrl: boolean): GridMove | null {
  switch (key) {
    case 'ArrowUp':    return 'up';
    case 'ArrowDown':  return 'down';
    case 'ArrowLeft':  return 'left';
    case 'ArrowRight': return 'right';
    case 'Home':       return withCtrl ? 'gridStart' : 'rowStart';
    case 'End':        return withCtrl ? 'gridEnd' : 'rowEnd';
    case 'PageUp':     return 'pageUp';
    case 'PageDown':   return 'pageDown';
    default:           return null;
  }
}

/** A block of cells by its edges, inclusive on all four. */
export interface GridCellRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/** Sides of a selection a cell sits on. */
export type GridRectEdge = 'top' | 'right' | 'bottom' | 'left';

/** The block a range covers, whichever corner the range was dragged from. */
export function rangeRect(range: GridCellRange): GridCellRect {
  return {
    top: Math.min(range.start.row, range.end.row),
    left: Math.min(range.start.col, range.end.col),
    bottom: Math.max(range.start.row, range.end.row),
    right: Math.max(range.start.col, range.end.col),
  };
}

/** Whether a position falls inside a block. */
export function rectContains(rect: GridCellRect, position: GridCellPosition): boolean {
  return (
    position.row >= rect.top && position.row <= rect.bottom && position.col >= rect.left && position.col <= rect.right
  );
}

/** Number of cells in a block. */
export function rectSize(rect: GridCellRect): number {
  return (rect.bottom - rect.top + 1) * (rect.right - rect.left + 1);
}

/**
 * The outer sides of a block that a cell touches, which is what a
 * renderer needs to draw one outline around the whole block.
 *
 * @returns The sides, or null when the cell is outside the block.
 */
export function rectEdges(rect: GridCellRect, position: GridCellPosition): GridRectEdge[] | null {
  if (!rectContains(rect, position)) return null;
  const edges: GridRectEdge[] = [];
  if (position.row === rect.top) edges.push('top');
  if (position.col === rect.right) edges.push('right');
  if (position.row === rect.bottom) edges.push('bottom');
  if (position.col === rect.left) edges.push('left');
  return edges;
}
