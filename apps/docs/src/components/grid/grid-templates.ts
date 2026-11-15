/**
 * @file Template slots of the grid: how an app draws a cell, or edits
 * one, with its own markup — a badge, a link, a dropdown, a date picker.
 */

import { Directive, TemplateRef, inject, input } from '@angular/core';
import { GridCellValue, GridColumn, GridMove, GridRow } from '../grid-core';

/** What a cell template receives. */
export interface NgAtomsGridCellContext<T = unknown> {
  /** Raw value of the cell. */
  $implicit: GridCellValue;
  /** The value as the grid would show it. */
  text: string;
  row: GridRow<T>;
  column: GridColumn<T>;
}

/** What an editor template receives. */
export interface NgAtomsGridEditorContext<T = unknown> {
  /** Raw value of the cell when the editor opened. */
  $implicit: GridCellValue;
  row: GridRow<T>;
  column: GridColumn<T>;
  /**
   * Ends the edit with a new value. The grid emits it as a change, like
   * any other edit, and optionally moves the active cell.
   */
  commit: (value: GridCellValue, move?: GridMove) => void;
  /** Ends the edit and keeps the current value. */
  cancel: () => void;
}

/**
 * Draws the cells of one column with the app's markup.
 *
 * ```html
 * <ng-template ngaGridCell="status" let-value>
 *   <span ngAtomsBadge>{{ value }}</span>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[ngaGridCell]', standalone: true })
export class NgAtomsGridCellDirective<T = unknown> {
  /** Id of the column the template draws. */
  readonly columnId = input.required<string>({ alias: 'ngaGridCell' });
  readonly template = inject<TemplateRef<NgAtomsGridCellContext<T>>>(TemplateRef);

  /** Types the template's variables. */
  static ngTemplateContextGuard<T>(
    _directive: NgAtomsGridCellDirective<T>,
    _context: unknown,
  ): _context is NgAtomsGridCellContext<T> {
    return true;
  }
}

/**
 * Edits the cells of one column with the app's control instead of the
 * built-in text field. The template calls `commit` with the new value,
 * or `cancel`.
 *
 * ```html
 * <ng-template ngaGridEditor="due" let-value let-commit="commit">
 *   <input type="date" [value]="value" (change)="commit($any($event.target).value)" />
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[ngaGridEditor]', standalone: true })
export class NgAtomsGridEditorDirective<T = unknown> {
  /** Id of the column the template edits. */
  readonly columnId = input.required<string>({ alias: 'ngaGridEditor' });
  readonly template = inject<TemplateRef<NgAtomsGridEditorContext<T>>>(TemplateRef);

  /** Types the template's variables. */
  static ngTemplateContextGuard<T>(
    _directive: NgAtomsGridEditorDirective<T>,
    _context: unknown,
  ): _context is NgAtomsGridEditorContext<T> {
    return true;
  }
}
