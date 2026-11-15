/**
 * @file Specs for exporting rows as delimited text.
 */

import { describe, expect, it } from 'vitest';
import { buildColumnModel, columnHeaderPaths } from './column-model';
import { exportDelimited, serializeDelimited } from './export';
import { buildRowTree, flattenRows } from './row-model';
import { GridColumnNode, GridRow } from './types';

const nodes: GridColumnNode[] = [
  { id: 'name', header: 'Name', tree: true },
  { id: 'q1', header: 'Q1', children: [{ id: 'jan', header: 'Jan', type: 'number' }] },
];

const rows: GridRow[] = [
  { id: 'a', data: { name: 'Desks, standing', jan: 1200.5 } },
  { id: 'b', parentId: 'a', data: { name: 'Model "X"', jan: null } },
];

const columns = buildColumnModel(nodes).columns;
const paths = columnHeaderPaths(nodes);

describe('serializeDelimited', () => {
  it('quotes fields that hold the delimiter, quotes or line breaks', () => {
    expect(serializeDelimited([['a,b', 'say "hi"', 'two\nlines', 'plain']])).toBe('"a,b","say ""hi""","two\nlines",plain');
  });

  it('only quotes for the delimiter in use', () => {
    expect(serializeDelimited([['a,b', 'c;d']], ';')).toBe('a,b;"c;d"');
  });
});

describe('exportDelimited', () => {
  it('writes a header line with group paths, then raw values', () => {
    const list = flattenRows(buildRowTree(rows), { expanded: new Set(['a']) });
    expect(exportDelimited(list, columns, paths)).toBe('Name,Q1 / Jan\r\n"Desks, standing",1200.5\r\n"Model ""X""",');
  });

  it('exports only the rows on show', () => {
    const list = flattenRows(buildRowTree(rows), {});
    expect(exportDelimited(list, columns, paths, { headers: false })).toBe('"Desks, standing",1200.5');
  });

  it('takes the text of each cell from the caller when given', () => {
    const list = flattenRows(buildRowTree(rows), {});
    const text = exportDelimited(list, columns, paths, { headers: false, delimiter: '\t' }, (row, column) => `${row.id}:${column.id}`);
    expect(text).toBe('a:name\ta:jan');
  });
});
