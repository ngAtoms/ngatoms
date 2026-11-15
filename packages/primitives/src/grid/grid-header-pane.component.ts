/**
 * @file Header pane: draws the header cells of one pane (left, center or
 * right) at the positions the grid computed, with the sort and filter
 * controls of each leaf column.
 */

import { Component, inject, input } from '@angular/core';
import { GridColumn } from '../grid-core';
import { GridRenderHeaderCell, NGA_GRID, NgAtomsGridContext } from './grid.context';

/** Renders column group and leaf headers for one pane. */
@Component({
  selector: 'nga-grid-header-pane',
  standalone: true,
  templateUrl: './grid-header-pane.component.html',
  host: { class: 'nga-grid__pane', role: 'presentation' },
})
export class NgAtomsGridHeaderPaneComponent<T = unknown> {
  protected readonly grid = inject(NGA_GRID) as NgAtomsGridContext<T>;

  readonly cells = input.required<GridRenderHeaderCell<T>[]>();

  /** Value of `aria-sort` for a header cell; null on unsortable columns. */
  protected ariaSort(column: GridColumn<T> | undefined): 'ascending' | 'descending' | 'none' | null {
    if (!column?.sortable) return null;
    const direction = this.grid.sortDirection(column.id);
    if (direction === 'asc') return 'ascending';
    return direction === 'desc' ? 'descending' : 'none';
  }

  /** Opens the column's filter, anchored to the button that was pressed. */
  protected openFilter(column: GridColumn<T>, event: Event): void {
    this.grid.openFilter(column, event.currentTarget as HTMLElement);
  }

  /**
   * Resizes a column while its handle is dragged. The handle captures
   * the pointer, so the drag keeps going when the pointer leaves it. A
   * column pinned right has its handle on the left edge and grows the
   * other way.
   *
   * @param startWidth Width of the column when the drag began.
   */
  protected startResize(column: GridColumn<T>, startWidth: number, event: PointerEvent): void {
    const handle = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const direction = column.pinned === 'right' ? -1 : 1;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);

    /** Follows the pointer. */
    const onMove = (move: PointerEvent): void => {
      this.grid.resizeColumn(column, startWidth + direction * (move.clientX - startX));
    };
    /** Ends the drag. */
    const onEnd = (): void => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }
}
