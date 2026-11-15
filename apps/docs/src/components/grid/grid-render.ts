/**
 * @file Pure helpers the grid uses to turn its models into what the
 * panes draw, and to read keyboard events.
 */

import { GridCellValue, GridColumnPane, GridHeaderCell, GridIndexRange, isEmptyValue } from '../grid-core';
import { GridRenderColumn, GridRenderHeaderCell } from './grid.context';

/** Text shown for a non-numeric cell value. */
export function toText(value: GridCellValue): string {
  return isEmptyValue(value) ? '' : String(value);
}

/** Positions the columns of a pane, optionally limited to a visible range. */
export function renderColumns<T>(pane: GridColumnPane<T>, firstIndex: number, range?: GridIndexRange): GridRenderColumn<T>[] {
  const start = range?.start ?? 0;
  const end = range?.end ?? pane.columns.length;
  const out: GridRenderColumn<T>[] = [];
  for (let i = start; i < end; i++) {
    out.push({
      column: pane.columns[i],
      index: firstIndex + i,
      left: pane.offsets[i],
      width: pane.offsets[i + 1] - pane.offsets[i],
    });
  }
  return out;
}

/** Whether a header cell covers at least one column of the range. */
function intersects<T>(cell: GridHeaderCell<T>, range: GridIndexRange): boolean {
  return cell.colStart < range.end && cell.colStart + cell.colSpan > range.start;
}

/** Positions the header cells of a pane, optionally limited to a visible column range. */
export function renderHeaderCells<T>(
  pane: GridColumnPane<T>,
  rowHeight: number,
  range?: GridIndexRange,
): GridRenderHeaderCell<T>[] {
  const out: GridRenderHeaderCell<T>[] = [];
  for (const cells of pane.headerRows) {
    for (const cell of cells) {
      if (range && !intersects(cell, range)) continue;
      const left = pane.offsets[cell.colStart];
      out.push({
        key: `${cell.row}:${cell.key}`,
        cell,
        left,
        top: cell.row * rowHeight,
        width: pane.offsets[cell.colStart + cell.colSpan] - left,
        height: cell.rowSpan * rowHeight,
      });
    }
  }
  return out;
}

/** Whether a key press produces a character, as opposed to a command or a shortcut. */
export function isTypingKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}
