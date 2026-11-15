/**
 * @file Row drag and drop: which row a pointer is over, where a drop
 * would land, and whether the move makes sense. The renderer tracks the
 * pointer; the app applies the move.
 */

import { GridRowList, GridRowTree } from './row-model';
import { GridDropPosition, GridRowId, GridVisibleRow } from './types';

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

/** A keyboard move of a row past its sibling, and where the row lands. */
export interface GridSiblingMove {
  target: GridDropTarget;
  /** Display position of the moved row once the app has applied the move. */
  landing: number;
}

/** Depth of a visible entry; flat rows and paged placeholders are level 1. */
function levelOf<T>(entry: GridVisibleRow<T>): number {
  return entry.kind === 'row' ? entry.level : (entry.level ?? 1);
}

/** Number of entries a row takes on show: itself and its visible descendants. */
function blockSize<T>(list: GridRowList<T>, index: number): number {
  const level = levelOf(list.get(index));
  let end = index + 1;
  while (end < list.length && levelOf(list.get(end)) > level) end++;
  return end - index;
}

/**
 * Finds the sibling a row moves past with Alt+↑ or Alt+↓, skipping the
 * descendants of an expanded sibling: up lands before the previous
 * sibling, down lands after the next one and its branch.
 *
 * @returns Null when the row is first or last among its siblings.
 */
export function siblingMove<T>(list: GridRowList<T>, index: number, step: -1 | 1): GridSiblingMove | null {
  const entry = list.get(index);
  if (entry?.kind !== 'row') return null;
  const level = entry.level;

  if (step < 0) {
    for (let at = index - 1; at >= 0; at--) {
      const candidate = list.get(at);
      const candidateLevel = levelOf(candidate);
      if (candidateLevel < level) return null;
      if (candidateLevel === level) {
        return candidate.kind === 'row' ? { target: { index: at, position: 'before' }, landing: at } : null;
      }
    }
    return null;
  }

  const next = index + blockSize(list, index);
  if (next >= list.length) return null;
  const candidate = list.get(next);
  if (candidate.kind !== 'row' || candidate.level !== level) return null;
  return { target: { index: next, position: 'after' }, landing: index + blockSize(list, next) };
}
