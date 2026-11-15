/**
 * @file Focus and scrolling. Rows and cells are recycled as the grid
 * scrolls, so DOM focus cannot simply stay where the browser left it:
 * after every render this puts it where the grid's state says it belongs,
 * and it scrolls a cell or a column into view on request.
 */

import { GridCellPosition, GridColumnModel } from '../grid-core';
import { INTERACTIVE_SELECTOR } from './grid-render';

/** What the focus controller reads from the grid. */
export interface GridFocusDeps<T> {
  /** The scroll viewport. */
  viewport(): HTMLElement;
  document: Document;
  rowHeight(): number;
  headerHeight(): number;
  columnModel(): GridColumnModel<T>;
  /** Position among the leaf columns of the header that has keyboard focus, if one has. */
  headerColumn(): number | null;
  /** Whether the open editor should start with its text selected. */
  selectsAllOnEdit(): boolean;
}

/** Keeps DOM focus and the scroll position in step with the grid's state. */
export class GridFocusController<T> {
  /**
   * Set when the grid itself removes the focused element (closing the
   * editor) or moves focus on purpose (to a header), so the next render
   * knows focus belongs inside the grid even though it is not there now.
   */
  private owed = false;

  constructor(private readonly deps: GridFocusDeps<T>) {}

  /** Asks for focus to be placed by the grid after the next render. */
  request(): void {
    this.owed = true;
  }

  /** Withdraws that request: the user moved focus away on purpose. */
  release(): void {
    this.owed = false;
  }

  /**
   * Puts DOM focus on the right element: a column header that was
   * reached from the keyboard, the editor while editing (the app's own
   * control when it gave an editor template), otherwise the active cell
   * — or the viewport when that cell is scrolled out of the rendered
   * window. Focus is never taken from outside the grid, nor from header
   * controls, nor from a control inside the active cell.
   */
  sync(): void {
    const host = this.deps.viewport();
    const focused = this.deps.document.activeElement as HTMLElement | null;
    const owed = this.owed;
    this.owed = false;

    const headerColumn = this.deps.headerColumn();
    if (headerColumn !== null) {
      if (owed) this.headerCellAt(headerColumn)?.focus({ preventScroll: true });
      return;
    }
    const focusInCells = !!focused && host.contains(focused) && !focused.closest('.nga-grid__header');
    if (!focusInCells && !owed) return;

    const editor = host.querySelector<HTMLInputElement>('.nga-grid__editor');
    if (editor) {
      if (focused !== editor) this.focusEditor(editor);
      return;
    }
    const custom = host.querySelector<HTMLElement>('.nga-grid__custom-editor');
    if (custom) {
      if (!custom.contains(focused)) custom.querySelector<HTMLElement>(`${INTERACTIVE_SELECTOR}, [tabindex]`)?.focus();
      return;
    }
    const target = host.querySelector<HTMLElement>('.nga-grid__cell--active') ?? host;
    const insideTarget = target !== host && target.contains(focused);
    if (focused !== target && !insideTarget) target.focus({ preventScroll: true });
  }

  /**
   * Scrolls just enough to bring a cell fully into view.
   * Pinned columns are always visible, so only center columns scroll
   * sideways, within the strip left between the pinned panes.
   */
  scrollIntoView(position: GridCellPosition): void {
    const element = this.deps.viewport();
    const rowHeight = this.deps.rowHeight();
    const top = position.row * rowHeight;
    const visibleHeight = element.clientHeight - this.deps.headerHeight();
    if (top < element.scrollTop) element.scrollTop = top;
    else if (top + rowHeight > element.scrollTop + visibleHeight) element.scrollTop = top + rowHeight - visibleHeight;

    this.scrollColumnIntoView(position.col);
  }

  /** Scrolls sideways just enough to bring a column fully into view; pinned columns always are. */
  scrollColumnIntoView(col: number): void {
    const element = this.deps.viewport();
    const { left, center, right } = this.deps.columnModel().panes;
    const centerIndex = col - left.columns.length;
    if (centerIndex < 0 || centerIndex >= center.columns.length) return;
    const start = center.offsets[centerIndex];
    const end = center.offsets[centerIndex + 1];
    const visibleWidth = element.clientWidth - left.width - right.width;
    if (start < element.scrollLeft) element.scrollLeft = start;
    else if (end > element.scrollLeft + visibleWidth) element.scrollLeft = end - visibleWidth;
  }

  /** The header cell element of a leaf column, when it is rendered. */
  private headerCellAt(col: number): HTMLElement | null {
    const column = this.deps.columnModel().columns[col];
    if (!column) return null;
    return this.deps
      .viewport()
      .querySelector<HTMLElement>(`.nga-grid__header-cell[data-column-id="${CSS.escape(column.id)}"]`);
  }

  /** Focuses the editor, selecting its text or placing the caret at the end. */
  private focusEditor(editor: HTMLInputElement): void {
    editor.focus({ preventScroll: true });
    if (this.deps.selectsAllOnEdit()) editor.select();
    else editor.setSelectionRange(editor.value.length, editor.value.length);
  }
}
