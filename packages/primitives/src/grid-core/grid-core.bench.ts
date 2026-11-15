/**
 * @file Timing checks for grid-core at the size the grid is tuned for: 100k rows × 500 columns. Each operation is held to a budget several times what a laptop measures, so an algorithm going quadratic fails the run without a slow CI machine causing false alarms. Run with `npm run bench`.
 */

import { afterAll, describe, expect, it } from 'vitest';
import { buildColumnModel } from './column-model';
import { applyFilters } from './filter';
import { buildRowTree, flattenRows } from './row-model';
import { createRowComparator } from './sort';
import { GridColumn, GridColumnNode, GridRow } from './types';
import { fixedSizeRange, variableSizeRange } from './viewport';

const ROWS = 100_000;
const COLUMNS = 500;

interface Line { name: string; amount: number }

function makeRows(): GridRow<Line>[] {
  const rows: GridRow<Line>[] = [];
  let n = 0;
  for (let e = 0; e < 10 && rows.length < ROWS; e++) {
    const entity = `e${e}`;
    rows.push({ id: entity, data: { name: `Entity ${e}`, amount: n++ } });
    for (let a = 0; a < 100 && rows.length < ROWS; a++) {
      const account = `${entity}-a${a}`;
      rows.push({ id: account, parentId: entity, data: { name: `Account ${a}`, amount: n++ } });
      for (let l = 0; l < 99 && rows.length < ROWS; l++) {
        rows.push({
          id: `${account}-l${l}`,
          parentId: account,
          data: { name: `Line ${l} ${l % 7 === 0 ? 'travel' : 'other'}`, amount: (n++ * 7919) % 10_007 },
        });
      }
    }
  }
  return rows;
}

function makeColumns(): GridColumnNode<Line>[] {
  const nodes: GridColumnNode<Line>[] = [{ id: 'name', header: 'Account', width: 260, pinned: 'left' }];
  for (let c = 0; nodes.length < 1 + COLUMNS / 12; c++) {
    nodes.push({
      id: `y${c}`,
      header: `Year ${c}`,
      children: [0, 1, 2, 3].map(q => ({
        id: `y${c}q${q}`,
        header: `Q${q + 1}`,
        children: [0, 1, 2].map(m => ({ id: `y${c}q${q}m${m}`, header: `M${q * 3 + m + 1}`, field: 'amount', width: 96 })),
      })),
    });
  }
  return nodes;
}

const rows = makeRows();
const columnNodes = makeColumns();
const tree = buildRowTree(rows);
const allExpanded = new Set(rows.map(r => r.id));
const columnModel = buildColumnModel(columnNodes);
const columns = new Map<string, GridColumn<Line>>([
  ['name', { id: 'name', header: 'Account' }],
  ['amount', { id: 'amount', header: 'Amount', type: 'number' }],
]);
const compare = createRowComparator([{ columnId: 'amount', direction: 'desc' }], columns);
const filter = applyFilters(tree, { name: { type: 'text', operator: 'contains', value: 'travel' } }, columns);

const results: { operation: string; 'median ms': number; 'budget ms': number }[] = [];

function measure(operation: string, budgetMs: number, fn: () => void): void {
  it(operation, () => {
    fn();
    const samples: number[] = [];
    for (let i = 0; i < 15; i++) {
      const start = performance.now();
      fn();
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const median = samples[samples.length >> 1];
    results.push({ operation, 'median ms': +median.toFixed(3), 'budget ms': budgetMs });
    expect(median).toBeLessThan(budgetMs);
  });
}

describe(`grid-core at ${rows.length.toLocaleString('en')} rows × ${columnModel.columns.length} columns`, () => {
  afterAll(() => console.table(results));

  measure('build row tree', 150, () => {
    buildRowTree(rows);
  });

  measure('flatten, everything expanded', 50, () => {
    flattenRows(tree, { expanded: allExpanded });
  });

  measure('flatten after collapsing a 10k-row branch', 50, () => {
    const expanded = new Set(allExpanded);
    expanded.delete('e3');
    flattenRows(tree, { expanded });
  });

  measure('flatten, siblings sorted by amount', 400, () => {
    flattenRows(tree, { expanded: allExpanded, compare });
  });

  measure('apply a text filter', 150, () => {
    applyFilters(tree, { name: { type: 'text', operator: 'contains', value: 'travel' } }, columns);
  });

  measure('flatten a filtered tree', 50, () => {
    flattenRows(tree, { filter });
  });

  measure('build column model', 10, () => {
    buildColumnModel(columnNodes);
  });

  measure('visible ranges for one scroll frame', 0.5, () => {
    fixedSizeRange(1_234_567, 800, 28, rows.length, 5);
    variableSizeRange(23_456, 1400, columnModel.panes.center.offsets, 2);
  });
});
