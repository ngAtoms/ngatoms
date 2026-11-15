/**
 * @file Export: the rows on show as delimited text (CSV, TSV), with one
 * header line. The renderer decides how to deliver the text — a
 * download, the clipboard, an upload.
 */

import { GridRowList } from './row-model';
import { GridCellValue, GridColumn, GridRow } from './types';
import { getCellValue, isEmptyValue } from './value';

/** Separator between the headers of a column's groups and its own. */
export const HEADER_PATH_SEPARATOR = ' / ';

/** How an export is written. */
export interface GridExportOptions {
  /** Field separator. Defaults to a comma. */
  delimiter?: string;
  /** Whether the first line holds the column headers. Defaults to true. */
  headers?: boolean;
}

/** Text of a cell in an export. */
export type GridExportText<T = unknown> = (row: GridRow<T>, column: GridColumn<T>) => string;

/** Quotes a field when it holds the delimiter, a quote or a line break (RFC 4180). */
function quoteField(field: string, delimiter: string): string {
  const needsQuotes = field.includes(delimiter) || /["\n\r]/.test(field);
  return needsQuotes ? `"${field.replace(/"/g, '""')}"` : field;
}

/** Writes rows of fields as delimited text, with the line endings RFC 4180 asks for. */
export function serializeDelimited(rows: string[][], delimiter = ','): string {
  return rows.map(row => row.map(field => quoteField(field, delimiter)).join(delimiter)).join('\r\n');
}

/**
 * Text of a raw value, independent of locale and format: what another
 * program reads back as the same value.
 */
export function rawText(value: GridCellValue): string {
  return isEmptyValue(value) ? '' : String(value);
}

/**
 * Writes the listed rows as delimited text.
 * Rows that are not loaded are left out. Each column's header carries
 * the headers of its groups, so repeated leaf headers stay distinct.
 *
 * @param list The rows on show, in display order.
 * @param columns Leaf columns, in display order.
 * @param headerPaths Header path of each column, from `columnHeaderPaths`.
 * @param text Text of each cell; defaults to the raw value.
 */
export function exportDelimited<T>(
  list: GridRowList<T>,
  columns: GridColumn<T>[],
  headerPaths: ReadonlyMap<string, string[]>,
  options: GridExportOptions = {},
  text: GridExportText<T> = (row, column) => rawText(getCellValue(row, column)),
): string {
  const lines: string[][] = [];
  if (options.headers !== false) {
    lines.push(columns.map(column => (headerPaths.get(column.id) ?? [column.header]).join(HEADER_PATH_SEPARATOR)));
  }
  for (let index = 0; index < list.length; index++) {
    const entry = list.get(index);
    if (entry.kind === 'row') lines.push(columns.map(column => text(entry.row, column)));
  }
  return serializeDelimited(lines, options.delimiter);
}
