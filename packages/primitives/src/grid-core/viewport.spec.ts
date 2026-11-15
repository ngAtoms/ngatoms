/**
 * @file Specs for the viewport math.
 */

import { describe, expect, it } from 'vitest';
import { buildOffsets, fixedSizeRange, indexAtOffset, variableSizeRange } from './viewport';

describe('buildOffsets', () => {
  it('returns prefix sums with the total at the end', () => {
    expect(Array.from(buildOffsets([100, 50, 80]))).toEqual([0, 100, 150, 230]);
  });

  it('handles no items', () => {
    expect(Array.from(buildOffsets([]))).toEqual([0]);
  });
});

describe('indexAtOffset', () => {
  const offsets = buildOffsets([100, 50, 80]);

  it('finds the item containing a position', () => {
    expect(indexAtOffset(offsets, 0)).toBe(0);
    expect(indexAtOffset(offsets, 99)).toBe(0);
    expect(indexAtOffset(offsets, 100)).toBe(1);
    expect(indexAtOffset(offsets, 149)).toBe(1);
    expect(indexAtOffset(offsets, 150)).toBe(2);
  });

  it('clamps positions outside the content', () => {
    expect(indexAtOffset(offsets, -20)).toBe(0);
    expect(indexAtOffset(offsets, 9999)).toBe(2);
  });
});

describe('fixedSizeRange', () => {
  it('lists the rows intersecting the viewport', () => {
    expect(fixedSizeRange(0, 100, 20, 1000)).toEqual({ start: 0, end: 5 });
    expect(fixedSizeRange(30, 100, 20, 1000)).toEqual({ start: 1, end: 7 });
  });

  it('adds overscan on both sides, clamped to the data', () => {
    expect(fixedSizeRange(200, 100, 20, 1000, 3)).toEqual({ start: 7, end: 18 });
    expect(fixedSizeRange(0, 100, 20, 1000, 3)).toEqual({ start: 0, end: 8 });
    expect(fixedSizeRange(19_900, 100, 20, 1000, 3)).toEqual({ start: 992, end: 1000 });
  });

  it('stays inside the data when scrolled past the end', () => {
    expect(fixedSizeRange(50_000, 100, 20, 10)).toEqual({ start: 9, end: 10 });
  });

  it('is empty without rows or without a viewport', () => {
    expect(fixedSizeRange(0, 100, 20, 0)).toEqual({ start: 0, end: 0 });
    expect(fixedSizeRange(0, 0, 20, 100)).toEqual({ start: 0, end: 0 });
  });
});

describe('variableSizeRange', () => {
  const offsets = buildOffsets([100, 50, 80, 120, 60]);

  it('lists the columns intersecting the viewport', () => {
    expect(variableSizeRange(0, 150, offsets)).toEqual({ start: 0, end: 2 });
    expect(variableSizeRange(120, 150, offsets)).toEqual({ start: 1, end: 4 });
  });

  it('does not count a column that starts exactly at the far edge', () => {
    expect(variableSizeRange(0, 100, offsets)).toEqual({ start: 0, end: 1 });
  });

  it('adds overscan, clamped', () => {
    expect(variableSizeRange(120, 100, offsets, 1)).toEqual({ start: 0, end: 4 });
    expect(variableSizeRange(300, 200, offsets, 2)).toEqual({ start: 1, end: 5 });
  });

  it('is empty without columns', () => {
    expect(variableSizeRange(0, 100, buildOffsets([]))).toEqual({ start: 0, end: 0 });
  });
});
