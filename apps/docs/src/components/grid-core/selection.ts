/**
 * @file Active-cell navigation: where a keyboard move lands, given the
 * current position and the size of the grid. Pure position math — focus
 * and scrolling are the renderer's concern.
 */

import { GridCellPosition } from './types';

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
