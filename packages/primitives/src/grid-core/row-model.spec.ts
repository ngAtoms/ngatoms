/**
 * @file Specs for the row model. The sample tree is: revenue → (product → hardware, software), services; costs → payroll.
 */

import { describe, expect, it } from 'vitest';
import { GridRowList, ancestorsOf, buildRowTree, flattenRows, windowedRows } from './row-model';
import { GridRow } from './types';

const row = (id: string, parentId?: string, extra: Partial<GridRow> = {}): GridRow => ({
  id, parentId, data: { name: id }, ...extra,
});

const rows: GridRow[] = [
  row('revenue'),
  row('product', 'revenue'),
  row('hardware', 'product'),
  row('software', 'product'),
  row('services', 'revenue'),
  row('costs'),
  row('payroll', 'costs'),
];

const list = (rowList: GridRowList) =>
  Array.from({ length: rowList.length }, (_, i) => {
    const entry = rowList.get(i);
    return entry.kind === 'row' ? `${'  '.repeat(entry.level - 1)}${entry.row.id}` : `…${entry.index}`;
  });

describe('buildRowTree', () => {
  it('groups rows under their parents, keeping the given order', () => {
    const tree = buildRowTree(rows);
    expect(tree.roots.map(r => r.id)).toEqual(['revenue', 'costs']);
    expect(tree.childrenOf.get('revenue')?.map(r => r.id)).toEqual(['product', 'services']);
  });

  it('accepts children listed before their parent', () => {
    const tree = buildRowTree([row('child', 'parent'), row('parent')]);
    expect(tree.roots.map(r => r.id)).toEqual(['parent']);
    expect(tree.childrenOf.get('parent')?.map(r => r.id)).toEqual(['child']);
  });

  it('treats a row with an unknown parent as a root', () => {
    expect(buildRowTree([row('orphan', 'missing')]).roots.map(r => r.id)).toEqual(['orphan']);
  });

  it('treats a row that names itself as parent as a root', () => {
    expect(buildRowTree([row('self', 'self')]).roots.map(r => r.id)).toEqual(['self']);
  });
});

describe('ancestorsOf', () => {
  it('lists ancestors nearest first', () => {
    expect(ancestorsOf(buildRowTree(rows), 'hardware')).toEqual(['product', 'revenue']);
    expect(ancestorsOf(buildRowTree(rows), 'revenue')).toEqual([]);
  });

  it('terminates on a parent cycle', () => {
    const tree = buildRowTree([row('a', 'b'), row('b', 'a')]);
    expect(ancestorsOf(tree, 'a')).toEqual(['b']);
  });
});

describe('flattenRows', () => {
  const tree = buildRowTree(rows);

  it('shows only roots when nothing is expanded', () => {
    expect(list(flattenRows(tree))).toEqual(['revenue', 'costs']);
  });

  it('lists children right under an expanded parent, with levels', () => {
    const expanded = new Set(['revenue', 'product']);
    expect(list(flattenRows(tree, { expanded }))).toEqual([
      'revenue', '  product', '    hardware', '    software', '  services', 'costs',
    ]);
  });

  it('keeps a branch hidden while an ancestor is collapsed', () => {
    expect(list(flattenRows(tree, { expanded: new Set(['product']) }))).toEqual(['revenue', 'costs']);
  });

  it('reports hasChildren and expanded per row', () => {
    const entries = flattenRows(tree, { expanded: new Set(['revenue']) });
    const revenue = entries.get(0);
    const product = entries.get(1);
    const services = entries.get(2);
    expect(revenue).toMatchObject({ hasChildren: true, expanded: true });
    expect(product).toMatchObject({ hasChildren: true, expanded: false });
    expect(services).toMatchObject({ hasChildren: false, expanded: false });
  });

  it('marks a row with unloaded children as expandable, and open once expanded', () => {
    const lazy = buildRowTree([row('entity', undefined, { hasChildren: true })]);
    expect(flattenRows(lazy, {}).get(0)).toMatchObject({ hasChildren: true, expanded: false });
    expect(flattenRows(lazy, { expanded: new Set(['entity']) }).get(0)).toMatchObject({ hasChildren: true, expanded: true });
  });

  it('orders siblings with the comparator without changing the tree', () => {
    const byIdDesc = (a: GridRow, b: GridRow) => String(b.id).localeCompare(String(a.id));
    const expanded = new Set(['revenue', 'product', 'costs']);
    expect(list(flattenRows(tree, { expanded, compare: byIdDesc }))).toEqual([
      'revenue', '  services', '  product', '    software', '    hardware', 'costs', '  payroll',
    ]);
  });

  it('does not reorder the tree it was given', () => {
    flattenRows(tree, { compare: (a, b) => String(b.id).localeCompare(String(a.id)) });
    expect(tree.roots.map(r => r.id)).toEqual(['revenue', 'costs']);
  });

  it('shows matches with dimmed ancestors, opening the branches that lead to them', () => {
    const filter = { matched: new Set(['software']), visible: new Set(['software', 'product', 'revenue']) };
    const entries = flattenRows(tree, { filter });
    expect(list(entries)).toEqual(['revenue', '  product', '    software']);
    expect(entries.get(0)).toMatchObject({ dimmed: true, expanded: true });
    expect(entries.get(2)).toMatchObject({ dimmed: false });
  });

  it('finds a row position by id', () => {
    const entries = flattenRows(tree, { expanded: new Set(['revenue']) });
    expect(entries.indexOf('services')).toBe(2);
    expect(entries.indexOf('hardware')).toBe(-1);
  });

  it('survives a very deep tree', () => {
    const deep = Array.from({ length: 20_000 }, (_, i) => row(`n${i}`, i ? `n${i - 1}` : undefined));
    const expanded = new Set(deep.map(r => r.id));
    const entries = flattenRows(buildRowTree(deep), { expanded });
    expect(entries.length).toBe(20_000);
    expect(entries.get(19_999)).toMatchObject({ level: 20_000 });
  });
});

describe('windowedRows', () => {
  it('places loaded rows by index and fills the rest with placeholders', () => {
    const loaded = [row('r100', undefined, { index: 100 }), row('r101', undefined, { index: 101 })];
    const entries = windowedRows(loaded, 1_000_000);
    expect(entries.length).toBe(1_000_000);
    expect(entries.get(100)).toMatchObject({ kind: 'row', row: { id: 'r100' }, level: 1 });
    expect(entries.get(99)).toEqual({ kind: 'placeholder', index: 99 });
    expect(entries.indexOf('r101')).toBe(101);
    expect(entries.indexOf('nope')).toBe(-1);
  });

  it('falls back to array position for rows without an index', () => {
    expect(list(windowedRows([row('a'), row('b')], 4))).toEqual(['a', 'b', '…2', '…3']);
  });
});

describe('children that are loading', () => {
  const lazy: GridRow[] = [
    { id: 'a', hasChildren: true, data: {} },
    { id: 'b', data: {} },
  ];

  it('shows placeholders under an open row with no children yet', () => {
    const list = flattenRows(buildRowTree(lazy), { expanded: new Set(['a']) });
    const kinds = Array.from({ length: list.length }, (_, index) => list.get(index).kind);
    expect(kinds).toEqual(['row', 'placeholder', 'placeholder', 'placeholder', 'row']);
    const first = list.get(0);
    expect(first.kind === 'row' && first.expanded).toBe(true);
    const ghost = list.get(1);
    expect(ghost.kind === 'placeholder' && ghost.level).toBe(2);
    expect(list.indexOf('b')).toBe(4);
  });

  it('shows none while the row is closed', () => {
    expect(flattenRows(buildRowTree(lazy), {}).length).toBe(2);
  });

  it('gives way to the children once they arrive', () => {
    const loaded = [...lazy, { id: 'a1', parentId: 'a', data: {} }];
    const list = flattenRows(buildRowTree(loaded), { expanded: new Set(['a']) });
    expect(list.length).toBe(3);
    expect(list.get(1).kind).toBe('row');
  });
});
