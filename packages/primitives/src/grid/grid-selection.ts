/**
 * @file Selection state: the active cell, the far corner of the selected
 * block, and what follows from the two. It holds positions only; moving
 * focus, scrolling and editing are decided elsewhere.
 */

import { computed, signal } from '@angular/core';
import {
  GridBounds,
  GridCellPosition,
  GridCellRect,
  GridColumn,
  GridRowId,
  GridRowList,
  GridSelection,
  clampPosition,
  columnSelectionRect,
  rangeRect,
  rectEdges,
  rectSize,
  rowSelectionRect,
} from '../grid-core';

/** What the selection reads from the grid. */
export interface GridSelectionDeps<T> {
  bounds(): GridBounds;
  rowList(): GridRowList<T>;
  /** Leaf columns in display order. */
  columns(): GridColumn<T>[];
}

/** Holds the active cell and the selected block. */
export class GridSelectionController<T> {
  /** The active cell as last set; may point outside the grid after rows change. */
  private readonly requestedActive = signal<GridCellPosition | null>(null);
  /** The far corner of the selection as last set; the active cell is the near one. */
  private readonly requestedEnd = signal<GridCellPosition | null>(null);
  /** The mouse went down on a cell and has not been released since. */
  private dragging = false;
  /** The last activation landed on the cell that was already the only one selected. */
  private reactivated = false;

  /** The active cell, kept inside the grid as rows and columns come and go. */
  readonly activeCell = computed(() => {
    const requested = this.requestedActive();
    return requested ? clampPosition(requested, this.deps.bounds()) : null;
  });
  /** The far corner of the selection, or null when only the active cell is selected. */
  readonly rangeEnd = computed(() => {
    const requested = this.requestedEnd();
    return requested ? clampPosition(requested, this.deps.bounds()) : null;
  });
  /** The block of selected cells; a single cell when nothing was extended. */
  readonly rect = computed<GridCellRect | null>(() => {
    const active = this.activeCell();
    return active ? rangeRect({ start: active, end: this.rangeEnd() ?? active }) : null;
  });
  /** More than the active cell is selected. */
  readonly hasRange = computed(() => {
    const rect = this.rect();
    return !!rect && rectSize(rect) > 1;
  });
  /** The selection as the app receives it: the range, and the ids it covers. */
  readonly selection = computed<GridSelection | null>(() => {
    const active = this.activeCell();
    const rect = this.rect();
    if (!active || !rect) return null;

    const rowIds: GridRowId[] = [];
    const list = this.deps.rowList();
    for (let index = rect.top; index <= rect.bottom; index++) {
      const entry = list.get(index);
      if (entry?.kind === 'row') rowIds.push(entry.row.id);
    }
    const columnIds = this.deps.columns().slice(rect.left, rect.right + 1).map(column => column.id);
    return { range: { start: active, end: this.rangeEnd() ?? active }, rowIds, columnIds };
  });

  constructor(private readonly deps: GridSelectionDeps<T>) {}

  /** Whether the cell at a display position is the active cell. */
  isActive(row: number, col: number): boolean {
    const active = this.activeCell();
    return !!active && active.row === row && active.col === col;
  }

  /** Makes a cell the active cell and the only selected one. */
  setActive(position: GridCellPosition): void {
    this.reactivated = this.isActive(position.row, position.col) && !this.hasRange();
    this.requestedEnd.set(null);
    this.requestedActive.set(position);
  }

  /** Gives the grid an active cell if it has none yet. */
  ensureActive(): void {
    if (!this.activeCell()) this.requestedActive.set({ row: 0, col: 0 });
  }

  /** Whether the last activation was a second press on the same lone cell. */
  wasReactivated(): boolean {
    return this.reactivated;
  }

  /** Moves the far corner of the selection, leaving the active cell where it is. */
  extendTo(position: GridCellPosition): void {
    this.reactivated = false;
    this.requestedEnd.set(position);
  }

  /** Goes back to the active cell alone. */
  collapse(): void {
    this.requestedEnd.set(null);
  }

  /** Selects a block, with its top-left cell active. */
  select(rect: GridCellRect): void {
    this.requestedActive.set({ row: rect.top, col: rect.left });
    this.requestedEnd.set({ row: rect.bottom, col: rect.right });
  }

  /** Selects every cell, from the first to the last. */
  selectAll(): void {
    const { rowCount, columnCount } = this.deps.bounds();
    this.select({ top: 0, left: 0, bottom: rowCount - 1, right: columnCount - 1 });
  }

  /**
   * Selects the active cell's row.
   * The active cell moves to the first column of that row: a selection is
   * one rectangle, and its active cell is the top-left.
   */
  selectActiveRow(): void {
    const active = this.activeCell();
    const rect = active && rowSelectionRect(active, this.deps.bounds());
    if (rect) this.select(rect);
  }

  /**
   * Selects the active cell's column.
   * The active cell moves to the first row of that column: a selection is
   * one rectangle, and its active cell is the top-left.
   */
  selectActiveColumn(): void {
    const active = this.activeCell();
    const rect = active && columnSelectionRect(active, this.deps.bounds());
    if (rect) this.select(rect);
  }

  /**
   * Outer sides of the selection a cell touches, space-separated; empty
   * for a cell inside it. Null when the cell is not selected, or when
   * the selection is the active cell alone.
   */
  edges(row: number, col: number): string | null {
    const rect = this.rect();
    if (!rect || !this.hasRange()) return null;
    return rectEdges(rect, { row, col })?.join(' ') ?? null;
  }

  /** The mouse went down on a cell: a drag may follow. */
  beginDrag(): void {
    this.dragging = true;
  }

  /** The mouse moved over a cell; while the button stays down the selection follows it. */
  dragOver(position: GridCellPosition, pressed: boolean): void {
    if (!pressed) this.dragging = false;
    else if (this.dragging) this.extendTo(position);
  }

  /**
   * Extends a drag to the cell an element draws.
   *
   * @param headerDepth Number of header rows, which `aria-rowindex` counts before the first row.
   */
  dragOverElement(cell: HTMLElement, headerDepth: number): void {
    const row = Number(cell.parentElement?.getAttribute('aria-rowindex')) - headerDepth - 1;
    const col = Number(cell.getAttribute('aria-colindex')) - 1;
    if (this.dragging && row >= 0 && col >= 0) this.extendTo({ row, col });
  }
}
