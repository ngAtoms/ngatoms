/**
 * @file Specs for batch edits over a block: copy, clear, fill and paste.
 */

import { describe, expect, it } from 'vitest';
import { GridCellResolver, clearChanges, copyText, fillDownChanges, fillFromChanges, pasteChanges } from './batch';
import { GridColumn, GridRow } from './types';

interface Item {
  name: string;
  units: number | null;
  share: number;
}

const columns: GridColumn<Item>[] = [
  { id: 'name', header: 'Name' },
  { id: 'units', header: 'Units', type: 'number', editable: true },
  { id: 'share', header: 'Share', type: 'number', editable: true, format: { style: 'percent' } },
];

const rows: GridRow<Item>[] = [
  { id: 'a', data: { name: 'Desk', units: 1200, share: 0.25 } },
  { id: 'b', data: { name: 'Chair', units: 300, share: 0.5 } },
  { id: 'c', data: { name: 'Lamp', units: null, share: 0.125 } },
];

/** Resolves against the fixture; row `c` is locked. */
const resolve: GridCellResolver<Item> = ({ row, col }) => {
  const target = rows[row];
  const column = columns[col];
  if (!target || !column) return null;
  return { row: target, column, editable: !!column.editable && target.id !== 'c' };
};

const bounds = { rowCount: rows.length, columnCount: columns.length };

describe('copyText', () => {
  it('writes values in display units, ungrouped', () => {
    expect(copyText({ top: 0, left: 0, bottom: 1, right: 2 }, resolve, 'en-US')).toBe('Desk\t1200\t25\nChair\t300\t50');
  });

  it('writes empty cells as empty fields', () => {
    expect(copyText({ top: 2, left: 0, bottom: 2, right: 1 }, resolve, 'en-US')).toBe('Lamp\t');
  });

  it('uses the decimal separator of the locale', () => {
    expect(copyText({ top: 2, left: 2, bottom: 2, right: 2 }, resolve, 'pt-PT')).toBe('12,5');
  });
});

describe('clearChanges', () => {
  it('empties editable cells and leaves the rest alone', () => {
    const changes = clearChanges({ top: 0, left: 0, bottom: 2, right: 1 }, resolve);
    expect(changes).toEqual([
      { rowId: 'a', columnId: 'units', previous: 1200, next: null },
      { rowId: 'b', columnId: 'units', previous: 300, next: null },
    ]);
  });
});

describe('fillDownChanges', () => {
  it('copies the first row into the editable cells below', () => {
    const changes = fillDownChanges({ top: 0, left: 1, bottom: 2, right: 2 }, resolve);
    expect(changes).toEqual([
      { rowId: 'b', columnId: 'units', previous: 300, next: 1200 },
      { rowId: 'b', columnId: 'share', previous: 0.5, next: 0.25 },
    ]);
  });
});

describe('fillFromChanges', () => {
  it('gives the editable cells of the block the value of the source cell', () => {
    const changes = fillFromChanges({ top: 0, left: 1, bottom: 2, right: 1 }, { row: 0, col: 1 }, resolve);
    expect(changes).toEqual([{ rowId: 'b', columnId: 'units', previous: 300, next: 1200 }]);
  });

  it('fills right along a row', () => {
    const changes = fillFromChanges({ top: 1, left: 1, bottom: 1, right: 2 }, { row: 1, col: 1 }, resolve);
    expect(changes).toEqual([{ rowId: 'b', columnId: 'share', previous: 0.5, next: 300 }]);
  });
});

describe('pasteChanges', () => {
  it('parses each value for its column', () => {
    const result = pasteChanges([['1,500', '40%'], ['310', '60']], { top: 0, left: 1, bottom: 0, right: 1 }, bounds, resolve, 'en-US');
    expect(result?.changes).toEqual([
      { rowId: 'a', columnId: 'units', previous: 1200, next: 1500 },
      { rowId: 'a', columnId: 'share', previous: 0.25, next: 0.4 },
      { rowId: 'b', columnId: 'units', previous: 300, next: 310 },
      { rowId: 'b', columnId: 'share', previous: 0.5, next: 0.6 },
    ]);
    expect(result?.rejected).toEqual([]);
    expect(result?.rect).toEqual({ top: 0, left: 1, bottom: 1, right: 2 });
  });

  it('reports cells that do not accept edits and text that is not a value', () => {
    const result = pasteChanges([['x', 'abc'], ['y', '5'], ['z', '9']], { top: 0, left: 0, bottom: 0, right: 0 }, bounds, resolve, 'en-US');
    expect(result?.changes).toEqual([{ rowId: 'b', columnId: 'units', previous: 300, next: 5 }]);
    expect(result?.rejected).toEqual([
      { rowId: 'a', columnId: 'name', text: 'x', reason: 'readonly' },
      { rowId: 'a', columnId: 'units', text: 'abc', reason: 'invalid' },
      { rowId: 'b', columnId: 'name', text: 'y', reason: 'readonly' },
      { rowId: 'c', columnId: 'name', text: 'z', reason: 'readonly' },
      { rowId: 'c', columnId: 'units', text: '9', reason: 'readonly' },
    ]);
  });

  it('leaves out values that would change nothing', () => {
    const result = pasteChanges([['1200']], { top: 0, left: 1, bottom: 0, right: 1 }, bounds, resolve, 'en-US');
    expect(result?.changes).toEqual([]);
  });

  it('round-trips what copyText writes', () => {
    const rect = { top: 0, left: 1, bottom: 1, right: 2 };
    const text = copyText(rect, resolve, 'en-US') ?? '';
    const block = text.split('\n').map(line => line.split('\t'));
    expect(pasteChanges(block, rect, bounds, resolve, 'en-US')?.changes).toEqual([]);
  });
});
