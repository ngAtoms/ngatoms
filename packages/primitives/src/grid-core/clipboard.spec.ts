/**
 * @file Specs for tab-separated text and paste and fill targets.
 */

import { describe, expect, it } from 'vitest';
import { MAX_BATCH_CELLS, fillDownTargets, parseTsv, pasteTargets, rectPositions, serializeTsv } from './clipboard';

describe('serializeTsv', () => {
  it('joins fields with tabs and rows with line breaks', () => {
    expect(serializeTsv([['a', 'b'], ['1', '2']])).toBe('a\tb\n1\t2');
  });

  it('quotes fields that hold tabs, line breaks or quotes', () => {
    expect(serializeTsv([['a\tb', 'two\nlines', 'say "hi"']])).toBe('"a\tb"\t"two\nlines"\t"say ""hi"""');
  });
});

describe('parseTsv', () => {
  it('reads rows and fields', () => {
    expect(parseTsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('ignores the trailing line break and Windows line endings', () => {
    expect(parseTsv('a\tb\r\n1\t2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('keeps empty fields', () => {
    expect(parseTsv('a\t\tc\n\t\t')).toEqual([['a', '', 'c'], ['', '', '']]);
  });

  it('reads quoted fields', () => {
    expect(parseTsv('"a\tb"\t"two\nlines"\t"say ""hi"""')).toEqual([['a\tb', 'two\nlines', 'say "hi"']]);
  });

  it('round-trips what serializeTsv writes', () => {
    const rows = [['plain', 'with\ttab'], ['"quoted"', '']];
    expect(parseTsv(serializeTsv(rows))).toEqual(rows);
  });

  it('reads empty text as no rows', () => {
    expect(parseTsv('')).toEqual([]);
  });
});

describe('pasteTargets', () => {
  const bounds = { rowCount: 4, columnCount: 4 };

  it('fills the selection with a single value', () => {
    const targets = pasteTargets([['7']], { top: 1, left: 1, bottom: 2, right: 2 }, bounds);
    expect(targets?.map(target => [target.position.row, target.position.col, target.text])).toEqual([
      [1, 1, '7'], [1, 2, '7'], [2, 1, '7'], [2, 2, '7'],
    ]);
  });

  it('lays a block out from the top-left corner of the selection', () => {
    const targets = pasteTargets([['a', 'b'], ['c', 'd']], { top: 0, left: 1, bottom: 0, right: 1 }, bounds);
    expect(targets?.map(target => [target.position.row, target.position.col, target.text])).toEqual([
      [0, 1, 'a'], [0, 2, 'b'], [1, 1, 'c'], [1, 2, 'd'],
    ]);
  });

  it('drops what falls outside the grid', () => {
    const targets = pasteTargets([['a', 'b'], ['c', 'd']], { top: 3, left: 3, bottom: 3, right: 3 }, bounds);
    expect(targets).toEqual([{ position: { row: 3, col: 3 }, text: 'a' }]);
  });

  it('skips the missing fields of ragged rows', () => {
    const targets = pasteTargets([['a'], ['b', 'c']], { top: 0, left: 0, bottom: 0, right: 0 }, bounds);
    expect(targets?.length).toBe(3);
  });

  it('refuses a paste past the cell limit', () => {
    const huge = { top: 0, left: 0, bottom: MAX_BATCH_CELLS, right: 0 };
    expect(pasteTargets([['x']], huge, { rowCount: MAX_BATCH_CELLS + 1, columnCount: 1 })).toBeNull();
  });
});

describe('fillDownTargets', () => {
  it('copies the first row into the rows below', () => {
    const targets = fillDownTargets({ top: 2, left: 0, bottom: 4, right: 1 });
    expect(targets?.length).toBe(4);
    expect(targets?.[0]).toEqual({ source: { row: 2, col: 0 }, position: { row: 3, col: 0 } });
    expect(targets?.[3]).toEqual({ source: { row: 2, col: 1 }, position: { row: 4, col: 1 } });
  });

  it('has nothing to fill in a single row', () => {
    expect(fillDownTargets({ top: 1, left: 0, bottom: 1, right: 3 })).toEqual([]);
  });
});

describe('rectPositions', () => {
  it('lists positions row by row', () => {
    expect(rectPositions({ top: 0, left: 1, bottom: 1, right: 2 })).toEqual([
      { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    ]);
  });

  it('refuses a block past the cell limit', () => {
    expect(rectPositions({ top: 0, left: 0, bottom: MAX_BATCH_CELLS, right: 0 })).toBeNull();
  });
});
