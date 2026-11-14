/**
 * @file Specs for active-cell navigation.
 */

import { describe, expect, it } from 'vitest';
import { clampPosition, moveForKey, movePosition, rangeRect, rectContains, rectEdges, rectSize } from './selection';

const bounds = { rowCount: 100, columnCount: 10, pageSize: 20 };

describe('movePosition', () => {
  it('moves one cell in each direction', () => {
    const from = { row: 5, col: 5 };
    expect(movePosition(from, 'up', bounds)).toEqual({ row: 4, col: 5 });
    expect(movePosition(from, 'down', bounds)).toEqual({ row: 6, col: 5 });
    expect(movePosition(from, 'left', bounds)).toEqual({ row: 5, col: 4 });
    expect(movePosition(from, 'right', bounds)).toEqual({ row: 5, col: 6 });
  });

  it('stops at the edges instead of wrapping', () => {
    expect(movePosition({ row: 0, col: 0 }, 'up', bounds)).toEqual({ row: 0, col: 0 });
    expect(movePosition({ row: 0, col: 0 }, 'left', bounds)).toEqual({ row: 0, col: 0 });
    expect(movePosition({ row: 99, col: 9 }, 'down', bounds)).toEqual({ row: 99, col: 9 });
    expect(movePosition({ row: 99, col: 9 }, 'right', bounds)).toEqual({ row: 99, col: 9 });
  });

  it('jumps to the ends of the row and of the grid', () => {
    const from = { row: 5, col: 5 };
    expect(movePosition(from, 'rowStart', bounds)).toEqual({ row: 5, col: 0 });
    expect(movePosition(from, 'rowEnd', bounds)).toEqual({ row: 5, col: 9 });
    expect(movePosition(from, 'gridStart', bounds)).toEqual({ row: 0, col: 0 });
    expect(movePosition(from, 'gridEnd', bounds)).toEqual({ row: 99, col: 9 });
  });

  it('pages by the page size, clamped', () => {
    expect(movePosition({ row: 50, col: 2 }, 'pageDown', bounds)).toEqual({ row: 70, col: 2 });
    expect(movePosition({ row: 50, col: 2 }, 'pageUp', bounds)).toEqual({ row: 30, col: 2 });
    expect(movePosition({ row: 95, col: 2 }, 'pageDown', bounds)).toEqual({ row: 99, col: 2 });
    expect(movePosition({ row: 5, col: 2 }, 'pageUp', bounds)).toEqual({ row: 0, col: 2 });
  });

  it('returns null for an empty grid', () => {
    expect(movePosition({ row: 0, col: 0 }, 'down', { rowCount: 0, columnCount: 3, pageSize: 10 })).toBeNull();
  });
});

describe('clampPosition', () => {
  it('pulls a position back inside the grid', () => {
    expect(clampPosition({ row: 500, col: -3 }, bounds)).toEqual({ row: 99, col: 0 });
  });
});

describe('moveForKey', () => {
  it('maps navigation keys', () => {
    expect(moveForKey('ArrowDown', false)).toBe('down');
    expect(moveForKey('PageUp', false)).toBe('pageUp');
    expect(moveForKey('Home', false)).toBe('rowStart');
    expect(moveForKey('Home', true)).toBe('gridStart');
    expect(moveForKey('End', true)).toBe('gridEnd');
  });

  it('ignores other keys', () => {
    expect(moveForKey('a', false)).toBeNull();
    expect(moveForKey('Enter', false)).toBeNull();
  });
});

describe('rangeRect', () => {
  it('orders the corners whichever way the range was dragged', () => {
    expect(rangeRect({ start: { row: 5, col: 4 }, end: { row: 2, col: 6 } })).toEqual({ top: 2, left: 4, bottom: 5, right: 6 });
  });
});

describe('rect helpers', () => {
  const rect = { top: 1, left: 1, bottom: 3, right: 2 };

  it('counts the cells of a block', () => {
    expect(rectSize(rect)).toBe(6);
  });

  it('tells inside from outside', () => {
    expect(rectContains(rect, { row: 3, col: 2 })).toBe(true);
    expect(rectContains(rect, { row: 4, col: 2 })).toBe(false);
  });

  it('names the outer sides a cell touches', () => {
    expect(rectEdges(rect, { row: 1, col: 1 })).toEqual(['top', 'left']);
    expect(rectEdges(rect, { row: 2, col: 2 })).toEqual(['right']);
    expect(rectEdges(rect, { row: 3, col: 2 })).toEqual(['right', 'bottom']);
    expect(rectEdges(rect, { row: 0, col: 0 })).toBeNull();
  });

  it('gives a single cell all four sides', () => {
    expect(rectEdges({ top: 0, left: 0, bottom: 0, right: 0 }, { row: 0, col: 0 })).toEqual(['top', 'right', 'bottom', 'left']);
  });
});
