/**
 * @file Edits over the whole selection: copy, cut, paste, clear, fill,
 * undo and redo. Each becomes one batch of changes the grid emits; the
 * grid-core functions do the work, and this decides when they run and
 * what is reported.
 */

import {
  GridBatchRejection,
  GridBounds,
  GridCellChange,
  GridCellPosition,
  GridCellRect,
  GridCellRejection,
  GridCellResolver,
  MAX_BATCH_CELLS,
  clearChanges,
  copyText,
  createHistory,
  fillDownChanges,
  fillFromChanges,
  parseTsv,
  pasteChanges,
} from '../grid-core';
import { GridCellRef } from './grid-editing';

/** What batch edits need from the grid. */
export interface GridBatchDeps<T> {
  /** The selected block, if there is an active cell. */
  rect(): GridCellRect | null;
  active(): GridCellPosition | null;
  bounds(): GridBounds;
  cellAt(position: GridCellPosition): GridCellRef<T> | null;
  canEdit(cell: GridCellRef<T>): boolean;
  locale(): string | undefined;
  /** Whether a cell is being edited, in which case clipboard events belong to the editor. */
  isEditing(): boolean;
  /** Selects a block. */
  select(rect: GridCellRect): void;
  /** Emits a batch of changes to the app. */
  changed(changes: GridCellChange[]): void;
  /** Reports pasted values that were skipped. */
  rejected(rejections: GridCellRejection[]): void;
  /** Reports an operation that was too large to carry out. */
  refused(rejection: GridBatchRejection): void;
}

/** Runs the operations that touch every cell of the selection. */
export class GridBatchController<T> {
  /** Batches the user produced, for undo and redo. */
  private readonly history = createHistory();

  /** Looks a display position up for the grid-core batch functions. */
  private readonly resolve: GridCellResolver<T> = position => {
    const target = this.deps.cellAt(position);
    return target && { ...target, editable: this.deps.canEdit(target) };
  };

  constructor(private readonly deps: GridBatchDeps<T>) {}

  /** Emits a batch the user produced and remembers it for undo. */
  emit(changes: GridCellChange[]): void {
    if (!changes.length) return;
    this.history.record(changes);
    this.deps.changed(changes);
  }

  /** Takes back the last batch, by emitting its opposite. */
  undo(): void {
    this.replay(this.history.undo());
  }

  /** Emits the last undone batch again. */
  redo(): void {
    this.replay(this.history.redo());
  }

  /** Forgets the undo history. */
  clearHistory(): void {
    this.history.clear();
  }

  /** Puts the selection on the clipboard as tab-separated text. */
  copy(event: ClipboardEvent): void {
    const rect = this.clipboardRect(event);
    if (!rect) return;
    const text = copyText(rect, this.resolve, this.deps.locale());
    if (text === null) return this.refuse(event.type === 'cut' ? 'cut' : 'copy');
    event.clipboardData?.setData('text/plain', text);
    event.preventDefault();
  }

  /** Copies the selection, then clears its editable cells. */
  cut(event: ClipboardEvent): void {
    this.copy(event);
    if (event.defaultPrevented) this.clear();
  }

  /**
   * Turns pasted text into one batch of changes, starting at the
   * selection. Cells that cannot take their value are reported, and the
   * pasted block becomes the selection.
   */
  paste(event: ClipboardEvent): void {
    const rect = this.clipboardRect(event);
    const text = event.clipboardData?.getData('text/plain');
    if (!rect || !text) return;
    event.preventDefault();

    const result = pasteChanges(parseTsv(text), rect, this.deps.bounds(), this.resolve, this.deps.locale());
    if (!result) return this.refuse('paste');
    this.emit(result.changes);
    if (result.rejected.length) this.deps.rejected(result.rejected);
    if (result.rect) this.deps.select(result.rect);
  }

  /**
   * Emits one batch that empties the editable cells of the selection.
   *
   * @returns Whether there was a selection to clear.
   */
  clear(): boolean {
    const rect = this.deps.rect();
    if (!rect) return false;
    this.emitOrRefuse(clearChanges(rect, this.resolve), 'clear');
    return true;
  }

  /** Copies the first row of the selection into the rows below it. */
  fillDown(): void {
    const rect = this.deps.rect();
    if (rect) this.emitOrRefuse(fillDownChanges(rect, this.resolve), 'fill');
  }

  /** Gives every editable cell of the selection the value of the active cell. */
  fillFromActive(): void {
    const rect = this.deps.rect();
    const active = this.deps.active();
    if (rect && active) this.emitOrRefuse(fillFromChanges(rect, active, this.resolve), 'fill');
  }

  /** Emits a batch, or reports the operation when grid-core refused it for its size. */
  private emitOrRefuse(changes: GridCellChange[] | null, operation: GridBatchRejection['operation']): void {
    if (changes) this.emit(changes);
    else this.refuse(operation);
  }

  /** Reports an operation that was too large to carry out. */
  private refuse(operation: GridBatchRejection['operation']): void {
    this.deps.refused({ operation, limit: MAX_BATCH_CELLS });
  }

  /** Emits a batch that comes from the history, which already holds it. */
  private replay(changes: GridCellChange[] | null): void {
    if (changes) this.deps.changed(changes);
  }

  /**
   * The selection a clipboard event applies to, or null when the event
   * belongs to something else: the header, a text field, an open editor.
   */
  private clipboardRect(event: ClipboardEvent): GridCellRect | null {
    const elsewhere = !!(event.target as HTMLElement).closest('.nga-grid__header, input, textarea');
    return elsewhere || this.deps.isEditing() ? null : this.deps.rect();
  }
}
