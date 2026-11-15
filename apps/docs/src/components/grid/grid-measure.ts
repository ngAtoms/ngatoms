/**
 * @file DOM measuring for fitting a column to its content. The grid is
 * virtualized, so only the rows on screen can be measured.
 */

/** Widest a column is made by fitting it to its content, in px. */
const MAX_FIT_WIDTH = 600;

/** Room added to a measured width so text does not sit against the edge. */
const FIT_SLACK = 2;

/** Width an element occupies, margins included. */
function outerWidth(element: Element): number {
  const style = getComputedStyle(element);
  if (style.position === 'absolute') return 0;
  return element.getBoundingClientRect().width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
}

/**
 * Width a cell needs to show its text in full: the text itself plus
 * everything around it — siblings, gaps and padding — at every level
 * between the text and the cell.
 */
function naturalWidth(cell: HTMLElement, text: HTMLElement): number {
  let width = text.scrollWidth;
  for (let element: HTMLElement = text; element !== cell && element.parentElement; element = element.parentElement) {
    const parent = element.parentElement;
    const style = getComputedStyle(parent);
    const siblings = Array.from(parent.children).filter(child => child !== element);
    const flowing = siblings.map(outerWidth).filter(size => size > 0);
    width += flowing.reduce((total, size) => total + size, 0);
    width += (parseFloat(style.columnGap) || 0) * flowing.length;
    width += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  }
  return width;
}

/**
 * Width that fits a column's header and its cells on screen.
 *
 * @param host The grid's scroll viewport.
 * @param columnId Id of the column, which marks its header cell.
 * @param columnIndex Position among all leaf columns, which marks its body cells.
 */
export function measureColumnWidth(host: HTMLElement, columnId: string, columnIndex: number): number {
  const cells = [
    ...host.querySelectorAll<HTMLElement>(`.nga-grid__header-cell[data-column-id="${CSS.escape(columnId)}"]`),
    ...host.querySelectorAll<HTMLElement>(`.nga-grid__cell[aria-colindex="${columnIndex + 1}"]`),
  ];
  const widths = cells.map(cell => {
    const text = cell.querySelector<HTMLElement>('.nga-grid__header-text, .nga-grid__cell-text');
    return text ? naturalWidth(cell, text) : 0;
  });
  return Math.min(MAX_FIT_WIDTH, Math.ceil(Math.max(0, ...widths)) + FIT_SLACK);
}
