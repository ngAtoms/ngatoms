/**
 * @file Specs for the column model.
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_COLUMN_WIDTH, DEFAULT_MIN_COLUMN_WIDTH, buildColumnModel } from './column-model';
import { GridColumnNode } from './types';

const months = (quarter: string, names: string[]): GridColumnNode => ({
  id: quarter,
  header: quarter,
  children: names.map(name => ({ id: name, header: name, width: 90 })),
});

const statement: GridColumnNode[] = [
  { id: 'account', header: 'Account', width: 240, pinned: 'left' },
  {
    id: '2026',
    header: '2026',
    children: [months('Q1', ['Jan', 'Feb', 'Mar']), months('Q2', ['Apr', 'May', 'Jun'])],
  },
  { id: 'total', header: 'Total', width: 110, pinned: 'right' },
];

const cells = (row: { key: string; colStart: number; colSpan: number; rowSpan: number }[]) =>
  row.map(c => [c.key, c.colStart, c.colSpan, c.rowSpan]);

describe('buildColumnModel', () => {
  it('orders leaves left pane, center, right pane', () => {
    const model = buildColumnModel(statement);
    expect(model.columns.map(c => c.id)).toEqual(['account', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'total']);
    expect(model.indexById.get('Apr')).toBe(4);
    expect(model.panes.left.columns.map(c => c.id)).toEqual(['account']);
    expect(model.panes.right.columns.map(c => c.id)).toEqual(['total']);
  });

  it('computes pane widths and offsets', () => {
    const { panes } = buildColumnModel(statement);
    expect(panes.left.width).toBe(240);
    expect(panes.center.width).toBe(540);
    expect(Array.from(panes.center.offsets)).toEqual([0, 90, 180, 270, 360, 450, 540]);
  });

  it('builds one header row per nesting level, with spans', () => {
    const { panes, headerDepth } = buildColumnModel(statement);
    expect(headerDepth).toBe(3);
    const [years, quarters, leaves] = panes.center.headerRows;
    expect(cells(years)).toEqual([['2026', 0, 6, 1]]);
    expect(cells(quarters)).toEqual([['Q1', 0, 3, 1], ['Q2', 3, 3, 1]]);
    expect(cells(leaves)).toEqual([
      ['Jan', 0, 1, 1], ['Feb', 1, 1, 1], ['Mar', 2, 1, 1],
      ['Apr', 3, 1, 1], ['May', 4, 1, 1], ['Jun', 5, 1, 1],
    ]);
  });

  it('stretches ungrouped leaf headers down to the bottom row', () => {
    const { panes } = buildColumnModel(statement);
    expect(cells(panes.left.headerRows[0])).toEqual([['account', 0, 1, 3]]);
    expect(panes.left.headerRows[1]).toEqual([]);
    expect(panes.left.headerRows[2]).toEqual([]);
  });

  it('handles groups of uneven depth', () => {
    const { panes, headerDepth } = buildColumnModel([
      { id: 'g', header: 'G', children: [
        { id: 'a', header: 'A' },
        { id: 'h', header: 'H', children: [{ id: 'b', header: 'B' }] },
      ] },
    ]);
    expect(headerDepth).toBe(3);
    expect(cells(panes.center.headerRows[0])).toEqual([['g', 0, 2, 1]]);
    expect(cells(panes.center.headerRows[1])).toEqual([['a', 0, 1, 2], ['h', 1, 1, 1]]);
    expect(cells(panes.center.headerRows[2])).toEqual([['b', 1, 1, 1]]);
  });

  it('splits a group whose columns are pinned to different panes', () => {
    const { panes } = buildColumnModel([
      { id: 'g', header: 'G', children: [
        { id: 'a', header: 'A', pinned: 'left' },
        { id: 'b', header: 'B' },
        { id: 'c', header: 'C' },
      ] },
    ]);
    expect(cells(panes.left.headerRows[0])).toEqual([['g', 0, 1, 1]]);
    expect(cells(panes.center.headerRows[0])).toEqual([['g', 0, 2, 1]]);
  });

  it('does not merge two separate groups that share a header text', () => {
    const { panes } = buildColumnModel([
      { id: 'actual', header: 'Q1', children: [{ id: 'a', header: 'A' }] },
      { id: 'budget', header: 'Q1', children: [{ id: 'b', header: 'B' }] },
    ]);
    expect(cells(panes.center.headerRows[0])).toEqual([['actual', 0, 1, 1], ['budget', 1, 1, 1]]);
  });

  it('applies default, resized and minimum widths', () => {
    const nodes: GridColumnNode[] = [
      { id: 'a', header: 'A' },
      { id: 'b', header: 'B', width: 200 },
      { id: 'c', header: 'C', width: 10 },
      { id: 'd', header: 'D', minWidth: 150 },
    ];
    const widths = (m = buildColumnModel(nodes)) =>
      Array.from(m.panes.center.offsets).slice(1).map((o, i) => o - m.panes.center.offsets[i]);

    expect(widths()).toEqual([DEFAULT_COLUMN_WIDTH, 200, DEFAULT_MIN_COLUMN_WIDTH, 150]);
    expect(widths(buildColumnModel(nodes, new Map([['a', 300], ['b', 5]])))).toEqual([
      300, DEFAULT_MIN_COLUMN_WIDTH, DEFAULT_MIN_COLUMN_WIDTH, 150,
    ]);
  });

  it('handles no columns', () => {
    const model = buildColumnModel([]);
    expect(model.columns).toEqual([]);
    expect(model.headerDepth).toBe(1);
    expect(model.panes.center.width).toBe(0);
  });
});
