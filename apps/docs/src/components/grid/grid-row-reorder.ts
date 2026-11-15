/**
 * @file Row reordering: dragging a row by its handle, or moving it from
 * the keyboard. The grid only works out where the row would land and
 * reports the move; the app moves the row in its data.
 */

import { computed, signal } from '@angular/core';
import {
  GridCellPosition,
  GridDropTarget,
  GridRowId,
  GridRowList,
  GridRowMove,
  GridRowTree,
  isRowMoveAllowed,
  siblingMove,
} from '../grid-core';
import { trackRowDrag } from './grid-row-drag';

/** A row being dragged, and where it would land right now. */
interface RowDrag {
  rowId: GridRowId;
  /** Display position of the dragged row. */
  index: number;
  target: GridDropTarget | null;
  /** Whether dropping on the target is a move that makes sense. */
  allowed: boolean;
}

/** Where the drop marker is drawn. */
export interface GridDropIndicator {
  /** Offset from the top of the body, in px. */
  top: number;
  /** Height in px; zero for a rule between two rows. */
  height: number;
  /** The row would become a child of the target. */
  inside: boolean;
  allowed: boolean;
}

/** What row reordering needs from the grid. */
export interface GridRowReorderDeps<T> {
  /** Whether rows can be reordered right now. */
  enabled(): boolean;
  /** The scroll viewport. */
  viewport(): HTMLElement;
  rowList(): GridRowList<T>;
  rowTree(): GridRowTree<T>;
  rowHeight(): number;
  headerHeight(): number;
  /** Whether a row can be dropped into another. */
  allowInside(): boolean;
  active(): GridCellPosition | null;
  /** Makes a cell the active cell. */
  activate(position: GridCellPosition): void;
  /** Reports a move to the app. */
  moved(move: GridRowMove): void;
}

/** Tracks a row drag and turns drops into moves. */
export class GridRowReorderController<T> {
  private readonly drag = signal<RowDrag | null>(null);

  /** Where the drop marker is drawn while a row is dragged. */
  readonly indicator = computed<GridDropIndicator | null>(() => {
    const drag = this.drag();
    if (!drag?.target) return null;
    const { index, position } = drag.target;
    const height = this.deps.rowHeight();
    const inside = position === 'inside';
    return {
      top: (position === 'after' ? index + 1 : index) * height,
      height: inside ? height : 0,
      inside,
      allowed: drag.allowed,
    };
  });

  constructor(private readonly deps: GridRowReorderDeps<T>) {}

  /** Whether the row at a display position is the one being dragged. */
  isDragged(row: number): boolean {
    return this.drag()?.index === row;
  }

  /** Starts dragging the row at a display position, from a pointerdown on its handle. */
  start(row: number, event: PointerEvent): void {
    const entry = this.deps.rowList().get(row);
    if (entry?.kind !== 'row') return;
    const rowId = entry.row.id;

    trackRowDrag(
      event,
      this.deps.viewport(),
      () => ({
        headerHeight: this.deps.headerHeight(),
        rowHeight: this.deps.rowHeight(),
        rowCount: this.deps.rowList().length,
        allowInside: this.deps.allowInside(),
      }),
      target => this.drag.set({ rowId, index: row, target, allowed: !!target && this.canDropOn(rowId, target) }),
      target => {
        this.drag.set(null);
        if (target && this.canDropOn(rowId, target)) this.report(rowId, target);
      },
    );
  }

  /**
   * Moves the active row one place up or down, the keyboard's
   * counterpart to dragging it. The active cell follows the row.
   *
   * @returns Whether rows can be reordered.
   */
  moveByKey(step: -1 | 1): boolean {
    const active = this.deps.active();
    if (!active || !this.deps.enabled()) return false;

    const entry = this.deps.rowList().get(active.row);
    const move = siblingMove(this.deps.rowList(), active.row, step);
    if (entry?.kind === 'row' && move && this.canDropOn(entry.row.id, move.target)) {
      this.report(entry.row.id, move.target);
      this.deps.activate({ row: move.landing, col: active.col });
    }
    return true;
  }

  /** Whether a dragged row may be dropped on a target. */
  private canDropOn(rowId: GridRowId, target: GridDropTarget): boolean {
    const entry = this.deps.rowList().get(target.index);
    return entry?.kind === 'row' && isRowMoveAllowed(this.deps.rowTree(), rowId, entry.row.id);
  }

  /** Reports the move of a row to a drop target. */
  private report(rowId: GridRowId, target: GridDropTarget): void {
    const entry = this.deps.rowList().get(target.index);
    if (entry?.kind === 'row') this.deps.moved({ rowId, targetId: entry.row.id, position: target.position });
  }
}
