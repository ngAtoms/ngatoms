/**
 * @file Viewport math for virtualization: pixel offsets of items and the
 * range of items that intersect the visible window, on either axis.
 */

/** Half-open range of indexes: `start` inclusive, `end` exclusive. */
export interface GridIndexRange {
  start: number;
  end: number;
}

const EMPTY_RANGE: GridIndexRange = { start: 0, end: 0 };

/**
 * Sub-pixel nudge applied to the far edge of the window, so an item that
 * starts exactly where the viewport ends is not reported as visible.
 */
const EDGE_EPSILON = 0.001;

/**
 * Builds the prefix sums of item sizes.
 * `offsets[i]` is where item `i` starts and `offsets[count]` is the total
 * size. A `Float64Array` keeps 100k+ entries compact and exact.
 */
export function buildOffsets(sizes: ArrayLike<number>): Float64Array {
  const offsets = new Float64Array(sizes.length + 1);
  for (let i = 0; i < sizes.length; i++) offsets[i + 1] = offsets[i] + sizes[i];
  return offsets;
}

/**
 * Finds the item that contains a pixel position, by binary search.
 *
 * @returns The item index, clamped to the first or last item when the
 * position falls outside the content.
 */
export function indexAtOffset(offsets: Float64Array, position: number): number {
  const count = offsets.length - 1;
  if (count <= 0) return 0;
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const mid = (low + high + 1) >>> 1;
    if (offsets[mid] <= position) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** Widens an inclusive `[first, last]` window by `overscan` items, clamped to the data. */
function withOverscan(first: number, last: number, count: number, overscan: number): GridIndexRange {
  return {
    start: Math.max(0, first - overscan),
    end: Math.min(count, last + 1 + overscan),
  };
}

/**
 * Visible range for items that all share one size, such as rows.
 *
 * @param scroll Scroll offset in px.
 * @param viewport Visible length in px.
 * @param itemSize Size of every item in px.
 * @param count Number of items.
 * @param overscan Extra items rendered on each side to hide scroll gaps.
 */
export function fixedSizeRange(
  scroll: number,
  viewport: number,
  itemSize: number,
  count: number,
  overscan = 0,
): GridIndexRange {
  if (count <= 0 || viewport <= 0 || itemSize <= 0) return EMPTY_RANGE;
  const max = count - 1;
  const first = Math.min(max, Math.max(0, Math.floor(scroll / itemSize)));
  const lastVisible = Math.ceil((scroll + viewport) / itemSize) - 1;
  const last = Math.min(max, Math.max(first, lastVisible));
  return withOverscan(first, last, count, overscan);
}

/**
 * Visible range for items of varying size, such as columns.
 *
 * @param scroll Scroll offset in px.
 * @param viewport Visible length in px.
 * @param offsets Prefix sums from {@link buildOffsets}.
 * @param overscan Extra items rendered on each side to hide scroll gaps.
 */
export function variableSizeRange(
  scroll: number,
  viewport: number,
  offsets: Float64Array,
  overscan = 0,
): GridIndexRange {
  const count = offsets.length - 1;
  if (count <= 0 || viewport <= 0) return EMPTY_RANGE;
  const first = indexAtOffset(offsets, Math.max(0, scroll));
  const last = indexAtOffset(offsets, Math.max(0, scroll + viewport - EDGE_EPSILON));
  return withOverscan(first, Math.max(first, last), count, overscan);
}
