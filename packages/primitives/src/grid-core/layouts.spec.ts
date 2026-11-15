/**
 * @file Layout fixtures. Each one is built through the column model and
 * the row model, which is the path a real grid takes.
 */

import { describe, expect, it } from 'vitest';
import { buildColumnModel } from './column-model';
import { buildRowTree, flattenRows } from './row-model';
import { GridColumnNode, GridRow } from './types';

interface PeriodLine {
  account: string;
  jan?: number;
  feb?: number;
  mar?: number;
}

interface EntityLine {
  entity: string;
  amount: number;
}

interface EntryLine {
  name: string;
  amount: number;
  qty: number;
}

describe('layout fixtures', () => {
  it('builds a period-by-period report: grouped months over an account tree', () => {
    const columns: GridColumnNode<PeriodLine>[] = [
      { id: 'account', header: 'Account', width: 200, pinned: 'left', tree: true },
      {
        id: 'y2026',
        header: '2026',
        children: [
          {
            id: 'q1',
            header: 'Q1',
            children: [
              { id: 'jan', header: 'Jan', type: 'number', width: 90 },
              { id: 'feb', header: 'Feb', type: 'number', width: 90 },
              { id: 'mar', header: 'Mar', type: 'number', width: 90 },
            ],
          },
          {
            id: 'q2',
            header: 'Q2',
            children: [{ id: 'apr', header: 'Apr', type: 'number', width: 90 }],
          },
        ],
      },
    ];
    const rows: GridRow<PeriodLine>[] = [
      { id: 'revenue', data: { account: 'Revenue', jan: 10, feb: 12, mar: 11 } },
      { id: 'product', parentId: 'revenue', data: { account: 'Product', jan: 7, feb: 8, mar: 6 } },
      { id: 'service', parentId: 'revenue', data: { account: 'Service', jan: 3, feb: 4, mar: 5 } },
    ];

    const model = buildColumnModel(columns);
    expect(model.headerDepth).toBe(3);
    expect(model.columns.map(column => column.id)).toEqual(['account', 'jan', 'feb', 'mar', 'apr']);
    expect(model.panes.left.columns.map(column => column.id)).toEqual(['account']);
    expect(model.panes.center.headerRows[0].map(cell => cell.header)).toEqual(['2026']);
    expect(model.panes.center.headerRows[1].map(cell => cell.header)).toEqual(['Q1', 'Q2']);

    const list = flattenRows(buildRowTree(rows), { expanded: new Set(['revenue']) });
    expect(list.length).toBe(3);
    expect(list.get(0)).toMatchObject({ kind: 'row', level: 1, expanded: true });
    expect(list.get(1)).toMatchObject({ kind: 'row', level: 2 });
    expect(list.get(2)).toMatchObject({ kind: 'row', level: 2 });
  });

  it('builds a flat entity summary', () => {
    const columns: GridColumnNode<EntityLine>[] = [
      { id: 'entity', header: 'Entity', width: 180 },
      { id: 'amount', header: 'Amount', type: 'number', width: 120 },
    ];
    const rows: GridRow<EntityLine>[] = [
      { id: 'north', data: { entity: 'North', amount: 40 } },
      { id: 'south', data: { entity: 'South', amount: 25 } },
    ];

    const model = buildColumnModel(columns);
    expect(model.headerDepth).toBe(1);
    expect(model.panes.center.columns.map(column => column.id)).toEqual(['entity', 'amount']);
    expect(model.panes.left.columns).toEqual([]);

    const list = flattenRows(buildRowTree(rows));
    expect(list.length).toBe(2);
    expect(list.get(0)).toMatchObject({ kind: 'row', level: 1, hasChildren: false });
    expect(list.get(1)).toMatchObject({ kind: 'row', level: 1, hasChildren: false });
  });

  it('builds a data-entry sheet with a pinned name and editable numbers', () => {
    const columns: GridColumnNode<EntryLine>[] = [
      { id: 'name', header: 'Name', width: 180, pinned: 'left' },
      { id: 'amount', header: 'Amount', type: 'number', editable: true, width: 100 },
      { id: 'qty', header: 'Qty', type: 'number', editable: true, width: 80 },
    ];
    const rows: GridRow<EntryLine>[] = [
      { id: 'line-1', data: { name: 'Bolts', amount: 12.5, qty: 4 } },
      { id: 'line-2', data: { name: 'Nuts', amount: 3, qty: 10 } },
    ];

    const model = buildColumnModel(columns);
    expect(model.panes.left.columns.map(column => column.id)).toEqual(['name']);
    expect(model.panes.center.columns.map(column => [column.id, column.editable])).toEqual([
      ['amount', true],
      ['qty', true],
    ]);

    const list = flattenRows(buildRowTree(rows));
    expect(list.length).toBe(2);
    expect(list.indexOf('line-2')).toBe(1);
  });
});
