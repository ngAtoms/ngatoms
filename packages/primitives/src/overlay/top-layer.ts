/**
 * @file Internal: shows an overlay panel in the browser's top layer with the
 * Popover API (`popover="manual"`), so no scroll container, transformed
 * ancestor or modal dialog hides it. The panel stays where it is in the DOM
 * and keeps the local theme; the overlay service still decides when it
 * closes. Where the API is missing (Firefox before 125) the panel simply
 * opens in place, and `placeFixed` keeps it at the right spot when an
 * ancestor holds its fixed position. Not exported from the overlay entry point.
 * @internal
 */

/** Whether the panel can use the Popover API; checked on each call, so it follows the browser. */
function supportsPopover(panel: HTMLElement): boolean {
  return typeof panel.showPopover === 'function';
}

/** @internal Marks a panel as a manual popover, so the component alone opens and closes it. */
export function prepareTopLayer(panel: HTMLElement): void {
  if (supportsPopover(panel) && !panel.hasAttribute('popover')) panel.setAttribute('popover', 'manual');
}

/** @internal Shows the panel in the top layer; without the Popover API it opens in place. */
export function showInTopLayer(panel: HTMLElement): void {
  prepareTopLayer(panel);
  if (supportsPopover(panel) && panel.isConnected && !panel.matches(':popover-open')) panel.showPopover();
}

/** @internal Takes the panel out of the top layer. */
export function hideFromTopLayer(panel: HTMLElement): void {
  if (supportsPopover(panel) && panel.isConnected && panel.matches(':popover-open')) panel.hidePopover();
}

/** Whether the panel is open in the top layer, where the viewport always holds a fixed panel. */
function isInTopLayer(panel: HTMLElement): boolean {
  return supportsPopover(panel) && panel.matches(':popover-open');
}

/**
 * @internal Puts a fixed panel at viewport coordinates. Outside the top layer
 * an ancestor with a transform, a filter or a backdrop filter, such as the
 * dialog panel, holds the fixed panel instead of the viewport; the panel is
 * then measured and moved back by the difference.
 */
export function placeFixed(panel: HTMLElement, top: number, left: number): void {
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  if (isInTopLayer(panel)) return;
  const box = panel.getBoundingClientRect();
  if (box.top !== top) panel.style.top = `${2 * top - box.top}px`;
  if (box.left !== left) panel.style.left = `${2 * left - box.left}px`;
}
