/**
 * @file Public entry point of the grid. The list is explicit: grid-core
 * stays internal, and only the types the grid's inputs, outputs and
 * template slots name are public. index.spec.ts pins the list.
 */

export { NgAtomsGridComponent } from './grid.component';
export type {
  NgAtomsGridCellStateFn,
  NgAtomsGridDataMode,
  NgAtomsGridDensity,
  NgAtomsGridExportOptions,
} from './grid.component';
export { NgAtomsGridCellDirective, NgAtomsGridEditorDirective } from './grid-templates';
export type { NgAtomsGridCellContext, NgAtomsGridEditorContext } from './grid-templates';
export { isColumnGroup } from '../grid-core/types';
export type {
  GridBatchRejection,
  GridCellChange,
  GridCellPosition,
  GridCellRange,
  GridCellRejection,
  GridCellState,
  GridCellValue,
  GridColumn,
  GridColumnGroup,
  GridColumnNode,
  GridColumnPin,
  GridColumnType,
  GridCustomFilter,
  GridDropPosition,
  GridFilter,
  GridFilterType,
  GridFilters,
  GridNumberFilter,
  GridNumberFormat,
  GridNumberOperator,
  GridRow,
  GridRowId,
  GridRowKind,
  GridRowMove,
  GridSelection,
  GridSetFilter,
  GridSort,
  GridTextFilter,
  GridTextOperator,
} from '../grid-core/types';
export type { GridCellRect, GridMove } from '../grid-core/selection';
export type { GridIndexRange } from '../grid-core/viewport';
export type { GridExportOptions } from '../grid-core/export';
export type { GridCellResolver, GridCellTarget } from '../grid-core/batch';
export { fillDownChanges, fillFromChanges } from '../grid-core/batch';
