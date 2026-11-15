/**
 * @file Contracts between the grid and its panes: the render models the
 * grid computes and the small interface panes use to call back into it.
 * Panes depend on this file only, never on the grid component class.
 */

import { InjectionToken, TemplateRef } from '@angular/core';
import {
  GridCellState,
  GridCellValue,
  GridColumn,
  GridHeaderCell,
  GridMove,
  GridRow,
  GridVarianceTone,
  GridVisibleRow,
} from '../grid-core';
import { NgAtomsGridCellContext, NgAtomsGridEditorContext } from './grid-templates';

/** A row to draw, with its vertical position. */
export interface GridRenderRow<T = unknown> {
  /** Slot in the pool of row elements; rows are recycled by slot while scrolling. */
  key: number;
  /** Display position among all rows. */
  index: number;
  /** Offset from the top of the body, in px. */
  top: number;
  entry: GridVisibleRow<T>;
}

/** A column to draw, with its horizontal position inside its pane. */
export interface GridRenderColumn<T = unknown> {
  column: GridColumn<T>;
  /** Position among all leaf columns, across panes. */
  index: number;
  left: number;
  width: number;
}

/** A header cell to draw, with its box inside its pane. */
export interface GridRenderHeaderCell<T = unknown> {
  /** Stable identity for change tracking. */
  key: string;
  cell: GridHeaderCell<T>;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** What a body cell shows. */
export interface GridCellView {
  text: string;
  numeric: boolean;
  /** Set on variance columns when the value reads as good or bad news. */
  tone: GridVarianceTone | null;
  /** Whether the cell accepts edits right now. */
  editable: boolean;
  /** State resolved by the app for this cell, if any. */
  state: GridCellState | null;
}

/** What panes may ask of the grid. */
export interface NgAtomsGridContext<T = unknown> {
  /** Resolves the display text and styling hints of a cell. */
  cell(row: GridRow<T>, column: GridColumn<T>): GridCellView;
  /** Expands or collapses a row. */
  toggleRow(row: GridRow<T>): void;
  /** Number of header rows, used to offset `aria-rowindex`. */
  headerDepth(): number;
  /** Current sort direction of a column, or null when it is not sorted. */
  sortDirection(columnId: string): 'asc' | 'desc' | null;
  /** Steps a column through ascending, descending and unsorted. */
  toggleSort(column: GridColumn<T>): void;
  /** Whether a column has an active filter. */
  hasFilter(columnId: string): boolean;
  /** Id of the column whose filter popover is open, or null. */
  openFilterColumn(): string | null;
  /** Opens the filter popover of a column, anchored to the given element. */
  openFilter(column: GridColumn<T>, anchor: HTMLElement): void;
  /** The app's template for the cells of a column, if it gave one. */
  cellTemplate(columnId: string): TemplateRef<NgAtomsGridCellContext<T>> | null;
  /** The app's template for editing the cells of a column, if it gave one. */
  editorTemplate(columnId: string): TemplateRef<NgAtomsGridEditorContext<T>> | null;
  /** What the open editor's template receives; null while no cell is being edited. */
  editorContext(): NgAtomsGridEditorContext<T> | null;
  /** Whether rows show a handle to drag them by. */
  canDragRows(): boolean;
  /** Starts dragging the row at a display position, from a pointerdown on its handle. */
  startRowDrag(row: number, event: PointerEvent): void;
  /** Whether the row at a display position is the one being dragged. */
  isDraggedRow(row: number): boolean;
  /** A key was pressed on a focused column header: move along the header, sort, filter, resize, or go back to the cells. */
  headerKey(column: GridColumn<T>, event: KeyboardEvent): void;
  /** Gives a column a width, kept within the column's limits. */
  resizeColumn(column: GridColumn<T>, width: number): void;
  /** Fits a column to its header and the cells on screen. */
  autoSizeColumn(column: GridColumn<T>): void;
  /** Whether the cell at a display position is the active cell. */
  isActive(row: number, col: number): boolean;
  /** Makes a cell the active cell and the only selected one. */
  activate(row: number, col: number): void;
  /** The mouse went down on a cell: it becomes the active cell, or with `extend` the far corner of the selection. */
  pressCell(row: number, col: number, extend: boolean): void;
  /** The mouse moved over a cell; while the button stays down the selection follows it. */
  dragOverCell(row: number, col: number, pressed: boolean): void;
  /**
   * Outer sides of the selection the cell touches, space-separated;
   * empty for a cell inside it. Null when the cell is not selected, or
   * when the selection is the active cell alone.
   */
  selectionEdges(row: number, col: number): string | null;
  /** A cell was tapped or clicked; on touch screens a second tap on the active cell edits it. */
  tapCell(row: number, col: number): void;
  /** Draft text of the cell when it is being edited, otherwise null. */
  editDraft(row: number, col: number): string | null;
  /** Whether the draft being edited was rejected as invalid. */
  isDraftInvalid(): boolean;
  /** Opens the editor on a cell, if it accepts edits. */
  startEdit(row: number, col: number): void;
  /** Replaces the draft text while editing. */
  updateDraft(text: string): void;
  /** Applies the draft and optionally moves the active cell; an invalid draft stays open. */
  commitEdit(move?: GridMove): void;
  /** Closes the editor without applying the draft. */
  cancelEdit(): void;
  /** Closes the editor because focus left it: applies a valid draft, discards an invalid one. */
  leaveEdit(): void;
}

/** One entry of the set filter's list. */
export interface GridFilterOption {
  value: GridCellValue;
  label: string;
}

export const NGA_GRID = new InjectionToken<NgAtomsGridContext>('NGA_GRID');

/** Indentation added per tree level, in px. */
export const GRID_TREE_INDENT = 16;
