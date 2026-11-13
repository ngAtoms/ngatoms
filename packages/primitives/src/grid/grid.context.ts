/**
 * @file Contracts between the grid and its panes: the render models the
 * grid computes and the small interface panes use to call back into it.
 * Panes depend on this file only, never on the grid component class.
 */

import { InjectionToken } from '@angular/core';
import { GridCellValue, GridColumn, GridHeaderCell, GridRow, GridVarianceTone, GridVisibleRow } from '../grid-core';

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
}

/** One entry of the set filter's list. */
export interface GridFilterOption {
  value: GridCellValue;
  label: string;
}

export const NGA_GRID = new InjectionToken<NgAtomsGridContext>('NGA_GRID');

/** Indentation added per tree level, in px. */
export const GRID_TREE_INDENT = 16;
