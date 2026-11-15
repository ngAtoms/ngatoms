/**
 * @file Specs for row drag and drop targets and move validation.
 */

import { describe, expect, it } from 'vitest';
import { dropTargetAt, isDescendant, isRowMoveAllowed } from './row-drag';
import { buildRowTree } from './row-model';
import { GridRow } from './types';

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
