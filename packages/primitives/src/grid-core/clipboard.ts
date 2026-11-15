/**
 * @file Clipboard: tab-separated text in the dialect spreadsheets use, and
 * the cells a paste or a fill lands on. No clipboard API is touched here;
 * the renderer hands text in and out.
 */

import { GridCellRect, rectSize } from './selection';
import { GridCellPosition } from './types';

/**
 * Most cells one copy, paste, clear or fill may touch. Past this the
 * work would freeze the page, so the operation is not carried out.
 */
export const MAX_BATCH_CELLS = 200_000;

/** A cell a paste writes to, with the text destined for it. */
export interface GridPasteTarget {
  position: GridCellPosition;
  text: string;
}

/** A cell a fill writes to, with the cell it copies from. */
export interface GridFillTarget {
  source: GridCellPosition;
  position: GridCellPosition;
}

/** Quotes a field when it holds a tab, a line break or a quote. */
function quoteField(field: string): string {
  return /["\t\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

/** Writes rows of fields as tab-separated text, one line per row. */
export function serializeTsv(rows: string[][]): string {
  return rows.map(row => row.map(quoteField).join('\t')).join('\n');
}

/**
 * Reads tab-separated text into rows of fields.
 * Understands quoted fields (with doubled quotes, tabs and line breaks
 * inside), Windows line endings, and the trailing line break
 * spreadsheets add.
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let index = 0;

  /** Closes the current field. */
  const endField = (): void => {
    row.push(field);
    field = '';
  };
  /** Closes the current row. */
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') quoted = true;
    else if (char === '\t') endField();
    else if (char === '\n') endRow();
    else if (char !== '\r') field += char;
    index++;
  }
  if (field !== '' || row.length > 0) endRow();
  return rows;
}

/**
 * Cells a pasted block lands on.
 * A single value fills the whole selection. A larger block is laid out
 * from the top-left corner of the selection, and whatever falls outside
 * the grid is dropped.
 *
 * @param block Rows of fields, as read by {@link parseTsv}.
 * @param rect The current selection.
 * @param bounds Size of the grid.
 * @returns The targets, or null when there would be more than {@link MAX_BATCH_CELLS}.
 */
export function pasteTargets(
  block: string[][],
  rect: GridCellRect,
  bounds: { rowCount: number; columnCount: number },
): GridPasteTarget[] | null {
  const single = block.length === 1 && block[0].length === 1;
  const height = single ? rect.bottom - rect.top + 1 : block.length;
  const width = single ? rect.right - rect.left + 1 : Math.max(0, ...block.map(row => row.length));
  if (height * width > MAX_BATCH_CELLS) return null;

  const targets: GridPasteTarget[] = [];
  for (let r = 0; r < height && rect.top + r < bounds.rowCount; r++) {
    for (let c = 0; c < width && rect.left + c < bounds.columnCount; c++) {
      const text = single ? block[0][0] : block[r][c];
      if (text !== undefined) targets.push({ position: { row: rect.top + r, col: rect.left + c }, text });
    }
  }
  return targets;
}

/**
 * Cells a fill-down writes to: every row of the block below the first
 * copies the cell above it in the first row.
 *
 * @returns The targets, or null when there would be more than {@link MAX_BATCH_CELLS}.
 */
export function fillDownTargets(rect: GridCellRect): GridFillTarget[] | null {
  if (rectSize(rect) > MAX_BATCH_CELLS) return null;
  const targets: GridFillTarget[] = [];
  for (let row = rect.top + 1; row <= rect.bottom; row++) {
    for (let col = rect.left; col <= rect.right; col++) {
      targets.push({ source: { row: rect.top, col }, position: { row, col } });
    }
  }
  return targets;
}

/**
 * Positions of a block, row by row.
 *
 * @returns The positions, or null when there are more than {@link MAX_BATCH_CELLS}.
 */
export function rectPositions(rect: GridCellRect): GridCellPosition[] | null {
  if (rectSize(rect) > MAX_BATCH_CELLS) return null;
  const positions: GridCellPosition[] = [];
  for (let row = rect.top; row <= rect.bottom; row++) {
    for (let col = rect.left; col <= rect.right; col++) positions.push({ row, col });
  }
  return positions;
}
