/**
 * @file Specs for sorting.
 */

import { describe, expect, it } from 'vitest';
import { buildRowTree, flattenRows } from './row-model';
import { createRowComparator, nextSort } from './sort';
import { GridColumn, GridRow } from './types';

interface Line { name: string; amount: number | string | null }

const row = (id: string, amount: Line['amount'], parentId?: string): GridRow<Line> => ({
  id, parentId, data: { name: id, amount },
});

const columns = new Map<string, GridColumn<Line>>([
  ['name', { id: 'name', header: 'Account' }],
  ['amount', { id: 'amount', header: 'Amount', type: 'number' }],
]);

const order = (rows: GridRow<Line>[], columnId: string, direction: 'asc' | 'desc') =>
  [...rows].sort(createRowComparator([{ columnId, direction }], columns)!).map(r => r.id);

describe('createRowComparator', () => {
  it('returns null when nothing is sorted or the column is unknown', () => {
    expect(createRowComparator([], columns)).toBeNull();
    expect(createRowComparator(null, columns)).toBeNull();
    expect(createRowComparator([{ columnId: 'ghost', direction: 'asc' }], columns)).toBeNull();
  });

  it('sorts numbers numerically, including decimal strings', () => {
    const rows = [row('a', 100), row('b', '20.5'), row('c', 3), row('d', -7)];
    expect(order(rows, 'amount', 'asc')).toEqual(['d', 'c', 'b', 'a']);
    expect(order(rows, 'amount', 'desc')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps empty values last in both directions', () => {
    const rows = [row('a', null), row('b', 2), row('c', ''), row('d', 1)];
    expect(order(rows, 'amount', 'asc')).toEqual(['d', 'b', 'a', 'c']);
    expect(order(rows, 'amount', 'desc')).toEqual(['b', 'd', 'a', 'c']);
  });

  it('sorts text ignoring case and reading digits as numbers', () => {
    const rows = [row('Item 10', 0), row('item 2', 0), row('Alpha', 0)];
    expect(order(rows, 'name', 'asc')).toEqual(['Alpha', 'item 2', 'Item 10']);
  });

  it('is stable for equal values', () => {
    const rows = [row('first', 1), row('second', 1), row('third', 1)];
    expect(order(rows, 'amount', 'asc')).toEqual(['first', 'second', 'third']);
    expect(order(rows, 'amount', 'desc')).toEqual(['first', 'second', 'third']);
  });

  it('orders siblings inside each parent when used to flatten', () => {
    const rows = [
      row('revenue', 500), row('services', 100, 'revenue'), row('product', 400, 'revenue'),
      row('costs', 900), row('rent', 600, 'costs'), row('payroll', 300, 'costs'),
    ];
    const compare = createRowComparator([{ columnId: 'amount', direction: 'desc' }], columns);
    const list = flattenRows(buildRowTree(rows), { expanded: new Set(['revenue', 'costs']), compare });
    const ids = Array.from({ length: list.length }, (_, i) => {
      const entry = list.get(i);
      return entry.kind === 'row' ? entry.row.id : null;
    });
    expect(ids).toEqual(['costs', 'rent', 'payroll', 'revenue', 'product', 'services']);
  });
});

describe('nextSort', () => {
  it('cycles ascending, descending, none', () => {
    const asc = nextSort([], 'amount');
    expect(asc).toEqual([{ columnId: 'amount', direction: 'asc' }]);
    const desc = nextSort(asc, 'amount');
    expect(desc).toEqual([{ columnId: 'amount', direction: 'desc' }]);
    expect(nextSort(desc, 'amount')).toEqual([]);
  });

  it('replaces the sort when another column is clicked', () => {
    expect(nextSort([{ columnId: 'name', direction: 'desc' }], 'amount')).toEqual([
      { columnId: 'amount', direction: 'asc' },
    ]);
  });
});
