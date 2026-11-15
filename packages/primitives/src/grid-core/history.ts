/**
 * @file Undo and redo. The grid never writes to rows, so undoing is not
 * restoring a snapshot: it is emitting the opposite change and letting
 * the app apply it like any other edit.
 */

import { GridCellChange } from './types';

/** Batches kept before the oldest is forgotten. */
export const DEFAULT_HISTORY_LIMIT = 100;

/** A stack of emitted batches that can be walked back and forth. */
export interface GridHistory {
  /** Remembers a batch the user produced; anything undone before it can no longer be redone. */
  record(batch: GridCellChange[]): void;
  /** The batch that takes back the last one, or null when there is nothing to undo. */
  undo(): GridCellChange[] | null;
  /** The last undone batch again, or null when there is nothing to redo. */
  redo(): GridCellChange[] | null;
  /** Forgets everything, for when the app loads different data. */
  clear(): void;
}

/** The batch that takes a batch back: each change reversed, last change first. */
export function invertChanges(batch: GridCellChange[]): GridCellChange[] {
  return batch
    .map(change => ({ ...change, previous: change.next, next: change.previous }))
    .reverse();
}

/**
 * Creates an empty history.
 *
 * @param limit Batches kept; the oldest is dropped when the stack is full.
 */
export function createHistory(limit = DEFAULT_HISTORY_LIMIT): GridHistory {
  let done: GridCellChange[][] = [];
  let undone: GridCellChange[][] = [];

  return {
    /** @inheritdoc */
    record(batch) {
      done = [...done, batch].slice(-limit);
      undone = [];
    },
    /** @inheritdoc */
    undo() {
      const batch = done[done.length - 1];
      if (!batch) return null;
      done = done.slice(0, -1);
      undone = [...undone, batch];
      return invertChanges(batch);
    },
    /** @inheritdoc */
    redo() {
      const batch = undone[undone.length - 1];
      if (!batch) return null;
      undone = undone.slice(0, -1);
      done = [...done, batch];
      return batch;
    },
    /** @inheritdoc */
    clear() {
      done = [];
      undone = [];
    },
  };
}
