/**
 * @file Body pane: draws the visible rows of one pane (left, center or
 * right). It only renders what it is given; all decisions about which
 * rows and columns are on show belong to the grid.
 */

import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { GridColumn, GridRow, getCellValue } from '../grid-core';
import { GRID_TREE_INDENT, GridRenderColumn, GridRenderRow, NGA_GRID, NgAtomsGridContext } from './grid.context';
import { NgAtomsGridCellContext } from './grid-templates';

/** Renders the rows and cells of one pane. */
@Component({
  selector: 'nga-grid-body-pane',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './grid-body-pane.component.html',
  host: { class: 'nga-grid__pane', role: 'presentation' },
})
export class NgAtomsGridBodyPaneComponent<T = unknown> {
  protected readonly grid = inject(NGA_GRID) as NgAtomsGridContext<T>;

  readonly rows = input.required<GridRenderRow<T>[]>();
  readonly columns = input.required<GridRenderColumn<T>[]>();

  /** Feeds what the user types into the grid's draft. */
  protected onEditorInput(event: Event): void {
    this.grid.updateDraft((event.target as HTMLInputElement).value);
  }

  /**
   * Handles the keys that end an edit: Enter commits and moves down (up
   * with Shift), Tab commits and moves right (left with Shift), Escape
   * cancels. Every key is kept from reaching the grid's own navigation.
   */
  protected onEditorKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      this.grid.commitEdit(event.shiftKey ? 'up' : 'down');
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.grid.commitEdit(event.shiftKey ? 'left' : 'right');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.grid.cancelEdit();
    }
  }

  /** Text announced and shown as a tooltip for an invalid cell. */
  protected invalidMessage(invalid: string | boolean | undefined): string | null {
    return typeof invalid === 'string' ? invalid : null;
  }

  /** Width of the indentation before a tree cell at the given level, in px. */
  protected indentOf(level: number): number {
    return (level - 1) * GRID_TREE_INDENT;
  }

  /** What a cell template receives for a cell. */
  protected cellContext(row: GridRow<T>, column: GridColumn<T>, text: string): NgAtomsGridCellContext<T> {
    return { $implicit: getCellValue(row, column), text, row, column };
  }

  /**
   * Keeps keys typed in a custom editor away from the grid's own
   * navigation. Escape closes the editor unless the control inside
   * already used it, for closing its own popup for example.
   */
  protected onCustomEditorKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' && !event.defaultPrevented) this.grid.cancelEdit();
  }
}
