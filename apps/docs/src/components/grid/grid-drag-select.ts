/**
 * @file Pointer tracking for selecting a block by dragging. Cells report
 * the pointer entering them; this covers what they cannot: the pointer
 * leaving the grid while the button is still down. The grid then scrolls
 * and the selection follows the nearest cell.
 */

/** How often the grid scrolls while the pointer is held outside it, in ms. */
const SCROLL_INTERVAL = 40;

/** Distance scrolled each time, in px. */
const SCROLL_STEP = 18;

/** How far inside the edge the nearest cell is looked up, in px. */
const EDGE_INSET = 4;

/** Restricts a number to the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Follows a drag that started on a cell until the button is released.
 *
 * @param viewport The grid's scroll viewport.
 * @param headerHeight Height of the header, which the pointer may be over without being over a cell.
 * @param onCell Called with the cell element nearest the pointer after each scroll step.
 */
export function trackDragSelect(viewport: HTMLElement, headerHeight: () => number, onCell: (cell: HTMLElement) => void): void {
  const view = viewport.ownerDocument;
  let pointer: { x: number; y: number } | null = null;

  /** Remembers where the pointer is. */
  const move = (event: MouseEvent): void => {
    pointer = { x: event.clientX, y: event.clientY };
  };
  /** Scrolls towards a pointer that is outside the cells, and reports the cell nearest to it. */
  const step = (): void => {
    if (!pointer) return;
    const box = viewport.getBoundingClientRect();
    const top = box.top + headerHeight();
    const dx = pointer.x < box.left ? -1 : pointer.x > box.right ? 1 : 0;
    const dy = pointer.y < top ? -1 : pointer.y > box.bottom ? 1 : 0;
    if (!dx && !dy) return;

    viewport.scrollLeft += dx * SCROLL_STEP;
    viewport.scrollTop += dy * SCROLL_STEP;
    const x = clamp(pointer.x, box.left + EDGE_INSET, box.left + viewport.clientWidth - EDGE_INSET);
    const y = clamp(pointer.y, top + EDGE_INSET, box.top + viewport.clientHeight - EDGE_INSET);
    const cell = view.elementFromPoint(x, y)?.closest<HTMLElement>('.nga-grid__cell');
    if (cell && viewport.contains(cell)) onCell(cell);
  };
  const timer = setInterval(step, SCROLL_INTERVAL);
  /** Stops following the pointer. */
  const stop = (): void => {
    clearInterval(timer);
    view.removeEventListener('mousemove', move);
    view.removeEventListener('mouseup', stop);
  };

  view.addEventListener('mousemove', move);
  view.addEventListener('mouseup', stop);
}
