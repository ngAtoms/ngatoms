/**
 * @file Specs for column filters.
 */

import { describe, expect, it } from 'vitest';
import { applyFilters, createFilterPredicate, distinctValues, isFilterActive } from './filter';
import { buildRowTree } from './row-model';
import { GridColumn, GridFilter, GridRow } from './types';

interface Line { name: string; amount: number | string | null; entity?: string }

const row = (id: string, parentId: string | undefined, data: Line): GridRow<Line> => ({ id, parentId, data });

const rows: GridRow<Line>[] = [
  row('opex', undefined, { name: 'Operating expenses', amount: 900 }),
  row('travel', 'opex', { name: 'Travel', amount: 300, entity: 'PT' }),
  row('flights', 'travel', { name: 'Flights', amount: 200, entity: 'PT' }),
  row('hotels', 'travel', { name: 'Hotels', amount: '100.50', entity: 'BR' }),
  row('rent', 'opex', { name: 'Rent', amount: 600, entity: 'BR' }),
  row('revenue', undefined, { name: 'Revenue', amount: null }),
];

const columns = new Map<string, GridColumn<Line>>([
  ['name', { id: 'name', header: 'Account' }],
  ['amount', { id: 'amount', header: 'Amount', type: 'number' }],
  ['entity', { id: 'entity', header: 'Entity' }],
]);

const tree = buildRowTree(rows);
const test = (filter: GridFilter<Line>, value: unknown) =>
  createFilterPredicate(filter)(value as never, rows[0]);
const sorted = (set: Set<unknown> | undefined) => [...(set ?? [])].sort();

describe('isFilterActive', () => {
  it('ignores filters that have not been filled in', () => {
    expect(isFilterActive(undefined)).toBe(false);
    expect(isFilterActive({ type: 'text', operator: 'contains', value: '' })).toBe(false);
    expect(isFilterActive({ type: 'number', operator: 'gt' })).toBe(false);
    expect(isFilterActive({ type: 'number', operator: 'between' })).toBe(false);
  });

  it('treats "empty" operators, bounded ranges and set filters as active', () => {
    expect(isFilterActive({ type: 'text', operator: 'empty' })).toBe(true);
    expect(isFilterActive({ type: 'number', operator: 'eq', value: 0 })).toBe(true);
    expect(isFilterActive({ type: 'number', operator: 'between', to: 10 })).toBe(true);
    expect(isFilterActive({ type: 'set', values: [] })).toBe(true);
  });
});

describe('text filter', () => {
  it('matches case-insensitively', () => {
    expect(test({ type: 'text', operator: 'contains', value: 'TRAV' }, 'Travel')).toBe(true);
    expect(test({ type: 'text', operator: 'startsWith', value: 'rav' }, 'Travel')).toBe(false);
    expect(test({ type: 'text', operator: 'equals', value: 'travel' }, 'Travel')).toBe(true);
  });

  it('never matches an empty value, except with "empty"', () => {
    expect(test({ type: 'text', operator: 'contains', value: 'a' }, null)).toBe(false);
    expect(test({ type: 'text', operator: 'empty' }, '')).toBe(true);
    expect(test({ type: 'text', operator: 'empty' }, 'x')).toBe(false);
  });
});

describe('number filter', () => {
  it('compares raw values', () => {
    expect(test({ type: 'number', operator: 'gt', value: 100 }, 100)).toBe(false);
    expect(test({ type: 'number', operator: 'gte', value: 100 }, 100)).toBe(true);
    expect(test({ type: 'number', operator: 'lt', value: 0 }, -5)).toBe(true);
    expect(test({ type: 'number', operator: 'ne', value: 3 }, 4)).toBe(true);
    expect(test({ type: 'number', operator: 'eq', value: 0 }, 0)).toBe(true);
  });

  it('reads decimal strings as numbers', () => {
    expect(test({ type: 'number', operator: 'gt', value: 100 }, '100.50')).toBe(true);
  });

  it('treats between as inclusive, with open ends unbounded', () => {
    expect(test({ type: 'number', operator: 'between', value: 10, to: 20 }, 10)).toBe(true);
    expect(test({ type: 'number', operator: 'between', value: 10, to: 20 }, 20)).toBe(true);
    expect(test({ type: 'number', operator: 'between', value: 10, to: 20 }, 21)).toBe(false);
    expect(test({ type: 'number', operator: 'between', to: 20 }, -999)).toBe(true);
  });

  it('never matches empty or non-numeric values, except with "empty"', () => {
    expect(test({ type: 'number', operator: 'lt', value: 10 }, null)).toBe(false);
    expect(test({ type: 'number', operator: 'lt', value: 10 }, 'n/a')).toBe(false);
    expect(test({ type: 'number', operator: 'empty' }, null)).toBe(true);
  });
});

describe('set filter', () => {
  it('keeps listed values and treats all empties as one', () => {
    expect(test({ type: 'set', values: ['PT'] }, 'PT')).toBe(true);
    expect(test({ type: 'set', values: ['PT'] }, 'BR')).toBe(false);
    expect(test({ type: 'set', values: [null] }, undefined)).toBe(true);
    expect(test({ type: 'set', values: [] }, 'PT')).toBe(false);
  });
});

describe('applyFilters', () => {
  it('returns null when no filter is active', () => {
    expect(applyFilters(tree, {}, columns)).toBeNull();
    expect(applyFilters(tree, null, columns)).toBeNull();
    expect(applyFilters(tree, { name: { type: 'text', operator: 'contains', value: '' } }, columns)).toBeNull();
  });

  it('keeps the ancestors of a match visible as context', () => {
    const result = applyFilters(tree, { name: { type: 'text', operator: 'contains', value: 'flight' } }, columns);
    expect(sorted(result?.matched)).toEqual(['flights']);
    expect(sorted(result?.visible)).toEqual(['flights', 'opex', 'travel']);
  });

  it('requires every filtered column to match', () => {
    const result = applyFilters(tree, {
      entity: { type: 'set', values: ['PT'] },
      amount: { type: 'number', operator: 'gte', value: 250 },
    }, columns);
    expect(sorted(result?.matched)).toEqual(['travel']);
  });

  it('matches nothing without failing', () => {
    const result = applyFilters(tree, { name: { type: 'text', operator: 'equals', value: 'zzz' } }, columns);
    expect(result?.matched.size).toBe(0);
    expect(result?.visible.size).toBe(0);
  });

  it('ignores filters for unknown columns', () => {
    expect(applyFilters(tree, { ghost: { type: 'text', operator: 'empty' } }, columns)).toBeNull();
  });

  it('supports custom predicates that see the row', () => {
    const result = applyFilters(tree, {
      amount: { type: 'custom', predicate: (value, r) => r.data.entity === 'BR' && Number(value) > 500 },
    }, columns);
    expect(sorted(result?.matched)).toEqual(['rent']);
  });

  it('leaves row values untouched', () => {
    applyFilters(tree, { entity: { type: 'set', values: ['BR'] } }, columns);
    expect(rows[0].data.amount).toBe(900);
  });
});

describe('distinctValues', () => {
  it('lists unique values sorted, with a single empty entry first', () => {
    expect(distinctValues(rows, columns.get('entity')!)).toEqual([null, 'BR', 'PT']);
  });

  it('sorts numbers numerically', () => {
    const data = [5, 100, 20].map((amount, i) => row(`r${i}`, undefined, { name: '', amount }));
    expect(distinctValues(data, columns.get('amount')!)).toEqual([5, 20, 100]);
  });
});
