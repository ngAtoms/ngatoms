/**
 * @file Batch edits over a block of cells: copy, clear, fill and paste.
 * Each one reads cells through a resolver and returns the changes to
 * emit — nothing here writes to rows or touches the clipboard.
 */

import { fillDownTargets, pasteTargets, rectPositions, serializeTsv } from './clipboard';
import { createCellChange, editTextOf, parseCellInput } from './edit';
import { resolveFormat } from './format';
import { GridCellRect } from './selection';
import { GridCellChange, GridCellPosition, GridCellRejection, GridColumn, GridRow } from './types';
import { getCellValue } from './value';

/** The row and column behind a display position. */
export interface GridCellTarget<T = unknown> {
  row: GridRow<T>;
  column: GridColumn<T>;
  /** Whether the cell accepts edits. */
  editable: boolean;
}

/** Looks a display position up; null for a row that is not loaded. */
export type GridCellResolver<T = unknown> = (position: GridCellPosition) => GridCellTarget<T> | null;

/** Outcome of a paste. */
export interface GridPasteResult {
  changes: GridCellChange[];
  /** Values that were skipped, and why. */
  rejected: GridCellRejection[];
  /** The block the paste covered, or null when it landed nowhere. */
  rect: GridCellRect | null;
}

/** Keeps the changes that are not null. */
function compact(changes: (GridCellChange | null)[]): GridCellChange[] {
  return changes.filter((change): change is GridCellChange => change !== null);
}

/**
 * Text of a block for the clipboard, tab-separated.
 * Values are written the way an editor shows them — display units,
 * ungrouped, with the locale's decimal separator — so they paste back
 * into the grid, or into a spreadsheet, as the same values.
 *
 * @returns The text, or null when the block is past the cell limit.
 */
export function copyText<T>(rect: GridCellRect, resolve: GridCellResolver<T>, locale?: string): string | null {
  const positions = rectPositions(rect);
  if (!positions) return null;

  const width = rect.right - rect.left + 1;
  const rows: string[][] = [];
  positions.forEach((position, index) => {
    if (index % width === 0) rows.push([]);
    const target = resolve(position);
    const value = target ? getCellValue(target.row, target.column) : null;
    rows[rows.length - 1].push(target ? editTextOf(value, resolveFormat(target.row, target.column), locale) : '');
  });
  return serializeTsv(rows);
}

/**
 * Changes that empty the editable cells of a block.
 *
 * @returns The changes, or null when the block is past the cell limit.
 */
export function clearChanges<T>(rect: GridCellRect, resolve: GridCellResolver<T>): GridCellChange[] | null {
  const positions = rectPositions(rect);
  if (!positions) return null;
  return compact(
    positions.map(position => {
      const target = resolve(position);
      return target?.editable ? createCellChange(target.row, target.column, null) : null;
    }),
  );
}

/**
 * Changes that copy the first row of a block into the editable cells
 * below it. Values are copied as they are; nothing is extrapolated.
 *
 * @returns The changes, or null when the block is past the cell limit.
 */
export function fillDownChanges<T>(rect: GridCellRect, resolve: GridCellResolver<T>): GridCellChange[] | null {
  const targets = fillDownTargets(rect);
  if (!targets) return null;
  return compact(
    targets.map(({ source, position }) => {
      const from = resolve(source);
      const to = resolve(position);
      if (!from || !to?.editable) return null;
      return createCellChange(to.row, to.column, getCellValue(from.row, from.column));
    }),
  );
}

/**
 * Changes that give every editable cell of a block the value of one
 * cell, usually the active one. With a block one row high this fills
 * right; one column wide, it fills down.
 *
 * @returns The changes, or null when the block is past the cell limit.
 */
export function fillFromChanges<T>(
  rect: GridCellRect,
  source: GridCellPosition,
  resolve: GridCellResolver<T>,
): GridCellChange[] | null {
  const positions = rectPositions(rect);
  const from = resolve(source);
  if (!positions) return null;
  if (!from) return [];

  const value = getCellValue(from.row, from.column);
  return compact(
    positions.map(position => {
      const target = resolve(position);
      return target?.editable ? createCellChange(target.row, target.column, value) : null;
    }),
  );
}

/**
 * Turns a pasted block into changes.
 * Cells that do not accept edits, and text that is not a value for its
 * column, are skipped and reported rather than stopping the paste.
 *
 * @param block Rows of fields read from the clipboard.
 * @param rect The current selection.
 * @param bounds Size of the grid.
 * @returns The outcome, or null when the paste is past the cell limit.
 */
export function pasteChanges<T>(
  block: string[][],
  rect: GridCellRect,
  bounds: { rowCount: number; columnCount: number },
  resolve: GridCellResolver<T>,
  locale?: string,
): GridPasteResult | null {
  const targets = pasteTargets(block, rect, bounds);
  if (!targets) return null;

  const changes: GridCellChange[] = [];
  const rejected: GridCellRejection[] = [];
  for (const { position, text } of targets) {
    const target = resolve(position);
    if (!target) continue;

    const { row, column } = target;
    const parsed = target.editable ? parseCellInput(text, column, resolveFormat(row, column), locale) : null;
    if (!parsed?.valid) {
      rejected.push({ rowId: row.id, columnId: column.id, text, reason: parsed ? 'invalid' : 'readonly' });
      continue;
    }
    const change = createCellChange(row, column, parsed.value);
    if (change) changes.push(change);
  }

  const first = targets[0]?.position;
  const last = targets[targets.length - 1]?.position;
  const covered = first && last ? { top: first.row, left: first.col, bottom: last.row, right: last.col } : null;
  return { changes, rejected, rect: covered };
}
