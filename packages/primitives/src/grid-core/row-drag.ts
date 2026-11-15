/**
 * @file Row drag and drop: which row a pointer is over, where a drop
 * would land, and whether the move makes sense. The renderer tracks the
 * pointer; the app applies the move.
 */

import { GridRowTree } from './row-model';
import { GridDropPosition, GridRowId } from './types';

/** Share of a row's height, at its top and at its bottom, that drops beside the row rather than inside it. */
const EDGE_SHARE = 0.3;

/** A place a dragged row can be dropped. */
export interface GridDropTarget {
  /** Display position of the row under the pointer. */
  index: number;
  position: GridDropPosition;
}

/**
 * Finds the drop target under a point.
 *
 * @param offset Distance from the top of the first row, in px.
 * @param rowHeight Height of a row, in px.
 * @param rowCount Number of rows on show.
 * @param allowInside Whether a row can be dropped into another; without it the middle of a row splits in two halves.
 * @returns The target, or null when there are no rows.
 */
export function dropTargetAt(
  offset: number,
  rowHeight: number,
  rowCount: number,
  allowInside: boolean,
): GridDropTarget | null {
  if (rowCount <= 0) return null;
  const index = Math.min(rowCount - 1, Math.max(0, Math.floor(offset / rowHeight)));
  const share = Math.min(1, Math.max(0, offset / rowHeight - index));
  const edge = allowInside ? EDGE_SHARE : 0.5;
  if (share < edge) return { index, position: 'before' };
  return { index, position: share >= 1 - edge ? 'after' : 'inside' };
}

/** Whether a row sits somewhere under another in the tree. */
export function isDescendant<T>(tree: GridRowTree<T>, rowId: GridRowId, ancestorId: GridRowId): boolean {
  let parentId = tree.byId.get(rowId)?.parentId;
  while (parentId !== undefined && parentId !== null) {
    if (parentId === ancestorId) return true;
    parentId = tree.byId.get(parentId)?.parentId;
  }
  return false;
}

/**
 * Whether a move can happen: a row cannot be dropped on itself, nor
 * anywhere inside its own branch.
 */
export function isRowMoveAllowed<T>(tree: GridRowTree<T>, rowId: GridRowId, targetId: GridRowId): boolean {
  return rowId !== targetId && !isDescendant(tree, targetId, rowId);
}
