/**
 * @file Specs for undo and redo.
 */

import { describe, expect, it } from 'vitest';
import { createHistory, invertChanges } from './history';
import { GridCellChange } from './types';

/** A change of one cell from one number to another. */
const change = (rowId: string, previous: number, next: number): GridCellChange => ({
  rowId,
  columnId: 'value',
  previous,
  next,
});

describe('invertChanges', () => {
  it('reverses each change and their order', () => {
    expect(invertChanges([change('a', 1, 2), change('b', 3, 4)])).toEqual([change('b', 4, 3), change('a', 2, 1)]);
  });
});

describe('createHistory', () => {
  it('has nothing to undo or redo when empty', () => {
    const history = createHistory();
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
  });

  it('undoes batches from the most recent back', () => {
    const history = createHistory();
    history.record([change('a', 1, 2)]);
    history.record([change('a', 2, 3)]);
    expect(history.undo()).toEqual([change('a', 3, 2)]);
    expect(history.undo()).toEqual([change('a', 2, 1)]);
    expect(history.undo()).toBeNull();
  });

  it('redoes what was undone', () => {
    const history = createHistory();
    history.record([change('a', 1, 2)]);
    history.undo();
    expect(history.redo()).toEqual([change('a', 1, 2)]);
    expect(history.undo()).toEqual([change('a', 2, 1)]);
  });

  it('drops the redo stack when a new batch is recorded', () => {
    const history = createHistory();
    history.record([change('a', 1, 2)]);
    history.undo();
    history.record([change('a', 1, 5)]);
    expect(history.redo()).toBeNull();
  });

  it('forgets the oldest batch past the limit', () => {
    const history = createHistory(2);
    history.record([change('a', 1, 2)]);
    history.record([change('a', 2, 3)]);
    history.record([change('a', 3, 4)]);
    history.undo();
    history.undo();
    expect(history.undo()).toBeNull();
  });

  it('forgets everything on clear', () => {
    const history = createHistory();
    history.record([change('a', 1, 2)]);
    history.clear();
    expect(history.undo()).toBeNull();
  });
});
