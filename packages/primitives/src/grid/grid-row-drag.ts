/**
 * @file Pointer tracking for dragging a row by its handle. It reports
 * where a drop would land as the pointer moves, scrolls the grid when
 * the pointer nears its top or bottom edge, and reports the final target.
 * Escape cancels the drag.
 */

import { GridDropTarget, dropTargetAt } from '../grid-core';

/** Distance from the top or bottom edge, in px, within which dragging scrolls the grid. */
const SCROLL_ZONE = 28;

/** Distance scrolled per pointer move inside the scroll zone, in px. */
const SCROLL_STEP = 14;

/** What the tracker needs to know about the grid, read again on every move. */
export interface RowDragGeometry {
  headerHeight: number;
  rowHeight: number;
  rowCount: number;
  /** Whether a row can be dropped into another. */
  allowInside: boolean;
}

/** Scrolls the viewport when the pointer is close to its top or bottom edge. */
function scrollNearEdge(viewport: HTMLElement, clientY: number, headerHeight: number): void {
  const box = viewport.getBoundingClientRect();
  if (clientY < box.top + headerHeight + SCROLL_ZONE) viewport.scrollTop -= SCROLL_STEP;
  else if (clientY > box.bottom - SCROLL_ZONE) viewport.scrollTop += SCROLL_STEP;
}

/**
 * Follows a drag that started on a row handle until the pointer is
 * released. The handle captures the pointer, so the drag carries on
 * outside it.
 *
 * @param event The pointerdown on the handle.
 * @param viewport The grid's scroll viewport.
 * @param geometry Current sizes of the grid.
 * @param onMove Called with the drop target under the pointer.
 * @param onEnd Called once: with the final target, or null when the drag was cancelled.
 */
export function trackRowDrag(
  event: PointerEvent,
  viewport: HTMLElement,
  geometry: () => RowDragGeometry,
  onMove: (target: GridDropTarget | null) => void,
  onEnd: (target: GridDropTarget | null) => void,
): void {
  const handle = event.currentTarget as HTMLElement;
  let target: GridDropTarget | null = null;
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);

  /** Works out the drop target under the pointer. */
  const move = (current: PointerEvent): void => {
    const { headerHeight, rowHeight, rowCount, allowInside } = geometry();
    scrollNearEdge(viewport, current.clientY, headerHeight);
    const offset = current.clientY - viewport.getBoundingClientRect().top - headerHeight + viewport.scrollTop;
    target = dropTargetAt(offset, rowHeight, rowCount, allowInside);
    onMove(target);
  };
  /** Cancels the drag on Escape. */
  const key = (pressed: KeyboardEvent): void => {
    if (pressed.key !== 'Escape') return;
    pressed.preventDefault();
    pressed.stopPropagation();
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    finish(false);
  };
  /** Stops listening and reports the outcome. */
  const finish = (dropped: boolean): void => {
    handle.ownerDocument.removeEventListener('keydown', key, true);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', drop);
    handle.removeEventListener('pointercancel', cancel);
    onEnd(dropped ? target : null);
  };
  /** The pointer was released. */
  const drop = (): void => finish(true);
  /** The browser took the pointer away. */
  const cancel = (): void => finish(false);

  handle.ownerDocument.addEventListener('keydown', key, true);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', drop);
  handle.addEventListener('pointercancel', cancel);
}
