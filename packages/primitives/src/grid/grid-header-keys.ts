/**
 * @file The header from the keyboard. From the first row, ↑ moves focus
 * to a column header; from there the keys reach what the mouse reaches:
 * sorting, the filter, the column's width, and the other headers.
 */

import { signal } from '@angular/core';
import { GridCellPosition, GridColumn, GridColumnModel } from '../grid-core';

/** Step of a column resize made from the keyboard, in px. */
const RESIZE_STEP = 16;

/** What the header keys need from the grid. */
export interface GridHeaderKeysDeps<T> {
  columnModel(): GridColumnModel<T>;
  /** Scrolls sideways just enough to bring a column into view. */
  scrollColumnIntoView(col: number): void;
  /** Gives a column a width. */
  resize(column: GridColumn<T>, width: number): void;
  toggleSort(column: GridColumn<T>): void;
  /** Opens a column's filter popover, anchored to an element. */
  openFilter(column: GridColumn<T>, anchor: HTMLElement): void;
  active(): GridCellPosition | null;
  /** Makes a cell the active cell. */
  activate(position: GridCellPosition): void;
  /** Asks for focus to be placed by the grid after the next render. */
  requestFocus(): void;
}

/** Moves keyboard focus along the header and acts on the focused column. */
export class GridHeaderKeysController<T> {
  /** Position among the leaf columns of the header that has keyboard focus, if one has. */
  readonly focused = signal<number | null>(null);

  constructor(private readonly deps: GridHeaderKeysDeps<T>) {}

  /** Moves keyboard focus to the header of a column, bringing it into view first. */
  focus(col: number): void {
    const last = this.deps.columnModel().columns.length - 1;
    if (last < 0) return;
    const index = Math.min(last, Math.max(0, col));
    this.deps.scrollColumnIntoView(index);
    this.focused.set(index);
    this.deps.requestFocus();
  }

  /** Notes that focus is no longer on a header. */
  blur(): void {
    this.focused.set(null);
  }

  /**
   * Acts on a key pressed on a column header. Left, Right, Home and End
   * move along the header; Enter or Space sorts; Alt+↓ (⌥↓ on a Mac)
   * opens the filter; Shift+← and Shift+→ resize; ↓ or Escape goes back
   * to the cells.
   *
   * @returns Whether the key was used.
   */
  handle(column: GridColumn<T>, event: KeyboardEvent): boolean {
    const index = this.deps.columnModel().indexById.get(column.id);
    if (index === undefined) return false;

    const { key } = event;
    const onControl = event.target !== event.currentTarget;
    const step = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
    if (step && event.shiftKey) return this.resizeBy(column, step);
    if (step) this.focus(index + step);
    else if (key === 'Home') this.focus(0);
    else if (key === 'End') this.focus(this.deps.columnModel().columns.length - 1);
    else if (key === 'ArrowDown' && event.altKey) this.openFilter(column, event.currentTarget as HTMLElement);
    else if (key === 'ArrowDown' || key === 'Escape') this.leave(index);
    else if ((key === 'Enter' || key === ' ') && !onControl && column.sortable) this.deps.toggleSort(column);
    else return false;
    return true;
  }

  /**
   * Resizes a column one step.
   *
   * @returns Whether the column can be resized.
   */
  private resizeBy(column: GridColumn<T>, step: number): boolean {
    if (column.resizable === false) return false;
    this.deps.resize(column, this.widthOf(column) + step * RESIZE_STEP);
    return true;
  }

  /** Current width of a column, in px. */
  private widthOf(column: GridColumn<T>): number {
    const { left, center, right } = this.deps.columnModel().panes;
    for (const pane of [left, center, right]) {
      const at = pane.columns.indexOf(column);
      if (at >= 0) return pane.offsets[at + 1] - pane.offsets[at];
    }
    return 0;
  }

  /** Opens a column's filter from its header cell, when the column has one. */
  private openFilter(column: GridColumn<T>, headerCell: HTMLElement): void {
    const button = headerCell.querySelector<HTMLElement>('.nga-grid__header-filter');
    if (column.filter && button) this.deps.openFilter(column, button);
  }

  /** Returns keyboard focus from the header to the cells, on the column it was on. */
  private leave(col: number): void {
    const active = this.deps.active();
    this.blur();
    this.deps.requestFocus();
    if (active) this.deps.activate({ row: active.row, col });
  }
}
