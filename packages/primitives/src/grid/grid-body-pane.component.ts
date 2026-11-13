/**
 * @file Body pane: draws the visible rows of one pane (left, center or
 * right). It only renders what it is given; all decisions about which
 * rows and columns are on show belong to the grid.
 */

import { Component, inject, input } from '@angular/core';
import { GRID_TREE_INDENT, GridRenderColumn, GridRenderRow, NGA_GRID, NgAtomsGridContext } from './grid.context';

/** Renders the rows and cells of one pane. */
@Component({
  selector: 'nga-grid-body-pane',
  standalone: true,
  templateUrl: './grid-body-pane.component.html',
  host: { class: 'nga-grid__pane', role: 'presentation' },
})
export class NgAtomsGridBodyPaneComponent<T = unknown> {
  protected readonly grid = inject(NGA_GRID) as NgAtomsGridContext<T>;

  readonly rows = input.required<GridRenderRow<T>[]>();
  readonly columns = input.required<GridRenderColumn<T>[]>();

  /** Width of the indentation before a tree cell at the given level, in px. */
  protected indentOf(level: number): number {
    return (level - 1) * GRID_TREE_INDENT;
  }
}
