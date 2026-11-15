/**
 * @file Specs for row drag and drop targets and move validation.
 */

import { describe, expect, it } from 'vitest';
import { dropTargetAt, isDescendant, isRowMoveAllowed, siblingMove } from './row-drag';
import { GridRowList, buildRowTree } from './row-model';
import { GridRow, GridVisibleRow } from './types';

const rows: GridRow[] = [
  { id: 'a', data: {} },
  { id: 'b', parentId: 'a', data: {} },
  { id: 'c', parentId: 'b', data: {} },
  { id: 'd', data: {} },
];
const tree = buildRowTree(rows);

describe('dropTargetAt', () => {
  it('splits a row in two halves when rows cannot nest', () => {
    expect(dropTargetAt(5, 30, 4, false)).toEqual({ index: 0, position: 'before' });
    expect(dropTargetAt(50, 30, 4, false)).toEqual({ index: 1, position: 'after' });
  });

  it('keeps the middle of a row for dropping inside it', () => {
    expect(dropTargetAt(32, 30, 4, true)).toEqual({ index: 1, position: 'before' });
    expect(dropTargetAt(45, 30, 4, true)).toEqual({ index: 1, position: 'inside' });
    expect(dropTargetAt(58, 30, 4, true)).toEqual({ index: 1, position: 'after' });
  });

  it('clamps to the first and last rows', () => {
    expect(dropTargetAt(-40, 30, 4, false)).toEqual({ index: 0, position: 'before' });
    expect(dropTargetAt(999, 30, 4, false)).toEqual({ index: 3, position: 'after' });
  });

  it('has no target without rows', () => {
    expect(dropTargetAt(10, 30, 0, false)).toBeNull();
  });
});

describe('isDescendant', () => {
  it('follows parents all the way up', () => {
    expect(isDescendant(tree, 'c', 'a')).toBe(true);
    expect(isDescendant(tree, 'a', 'c')).toBe(false);
    expect(isDescendant(tree, 'd', 'a')).toBe(false);
  });
});

describe('isRowMoveAllowed', () => {
  it('refuses a drop on the row itself or inside its own branch', () => {
    expect(isRowMoveAllowed(tree, 'a', 'a')).toBe(false);
    expect(isRowMoveAllowed(tree, 'a', 'c')).toBe(false);
  });

  it('allows everything else', () => {
    expect(isRowMoveAllowed(tree, 'c', 'a')).toBe(true);
    expect(isRowMoveAllowed(tree, 'b', 'd')).toBe(true);
  });
});

/** A visible list from `[id, level]` pairs, as an expanded tree shows it. */
function visible(entries: [string, number][]): GridRowList {
  const list: GridVisibleRow[] = entries.map(([id, level]) => ({
    kind: 'row',
    row: { id, data: {} },
    level,
    hasChildren: false,
    expanded: true,
    dimmed: false,
  }));
  return { length: list.length, get: (index: number) => list[index] } as GridRowList;
}

describe('siblingMove', () => {
  // p1 (expanded) > a, b · p2 (expanded) > c · p3
  const list = visible([
    ['p1', 1],
    ['a', 2],
    ['b', 2],
    ['p2', 1],
    ['c', 2],
    ['p3', 1],
  ]);

  it('moves down past an expanded sibling and its branch', () => {
    expect(siblingMove(list, 0, 1)).toEqual({ target: { index: 3, position: 'after' }, landing: 2 });
  });

  it('moves up before the previous sibling, skipping its descendants', () => {
    expect(siblingMove(list, 5, -1)).toEqual({ target: { index: 3, position: 'before' }, landing: 3 });
    expect(siblingMove(list, 3, -1)).toEqual({ target: { index: 0, position: 'before' }, landing: 0 });
  });

  it('moves a child among its siblings only', () => {
    expect(siblingMove(list, 1, 1)).toEqual({ target: { index: 2, position: 'after' }, landing: 2 });
    expect(siblingMove(list, 2, -1)).toEqual({ target: { index: 1, position: 'before' }, landing: 1 });
    expect(siblingMove(list, 1, -1)).toBeNull();
    expect(siblingMove(list, 2, 1)).toBeNull();
    expect(siblingMove(list, 4, 1)).toBeNull();
  });

  it('stops at the first and last rows', () => {
    expect(siblingMove(list, 0, -1)).toBeNull();
    expect(siblingMove(list, 5, 1)).toBeNull();
  });

  it('keeps a flat list to the adjacent row', () => {
    const flat = visible([['x', 1], ['y', 1], ['z', 1]]);
    expect(siblingMove(flat, 1, 1)).toEqual({ target: { index: 2, position: 'after' }, landing: 2 });
    expect(siblingMove(flat, 1, -1)).toEqual({ target: { index: 0, position: 'before' }, landing: 0 });
  });
});
