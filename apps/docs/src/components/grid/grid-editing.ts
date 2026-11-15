/**
 * @file The edit session: one cell being edited at a time, with the
 * built-in text field or the app's own editor template. An edit ends by
 * emitting a change — the grid never writes to rows — or by being
 * cancelled.
 */

import { computed, signal, untracked } from '@angular/core';
import {
  GridCellChange,
  GridCellPosition,
  GridCellValue,
  GridColumn,
  GridMove,
  GridRow,
  createCellChange,
  editTextOf,
  getCellValue,
  parseCellInput,
  resolveFormat,
} from '../grid-core';
import { NgAtomsGridEditorContext } from './grid-templates';

/** The row and column behind a display position. */
export interface GridCellRef<T> {
  row: GridRow<T>;
  column: GridColumn<T>;
}

/** An edit in progress. */
interface EditSession {
  position: GridCellPosition;
  text: string;
  /** The draft was rejected on the last attempt to commit it. */
  invalid: boolean;
  /** Select the whole text when the editor opens, rather than placing the caret at the end. */
  selectAll: boolean;
}

/** What editing needs from the grid. */
export interface GridEditDeps<T> {
  /** The row and column at a display position, or null for a row that is not loaded. */
  cellAt(position: GridCellPosition): GridCellRef<T> | null;
  canEdit(cell: GridCellRef<T>): boolean;
  locale(): string | undefined;
  /** Whether the app gave an editor template for a column. */
  hasEditorTemplate(columnId: string): boolean;
  /** Emits a batch the user produced. */
  emit(changes: GridCellChange[]): void;
  /** Makes a cell the active cell. */
  activate(position: GridCellPosition): void;
  /** Moves the active cell by one step. */
  move(move: GridMove): void;
  /** Asks for focus to return to the grid once the editor is gone. */
  requestFocus(): void;
  /** Withdraws that request. */
  releaseFocus(): void;
}

/** Opens, tracks and closes the editor of a cell. */
export class GridEditController<T> {
  private readonly session = signal<EditSession | null>(null);

  /** Whether a cell is being edited. */
  readonly isOpen = computed(() => this.session() !== null);
  /** Position of the cell being edited, if any. */
  readonly position = computed(() => this.session()?.position ?? null);
  /** What the open editor's template receives; one object per edit, so the template is not rebuilt on every render. */
  readonly context = computed<NgAtomsGridEditorContext<T> | null>(() => {
    const session = this.session();
    const target = session && untracked(() => this.deps.cellAt(session.position));
    if (!target) return null;
    return {
      $implicit: getCellValue(target.row, target.column),
      row: target.row,
      column: target.column,
      /** @inheritdoc */
      commit: (value, move) => this.commitValue(value, move),
      /** @inheritdoc */
      cancel: () => this.cancel(),
    };
  });

  constructor(private readonly deps: GridEditDeps<T>) {}

  /** Draft text of a cell when it is being edited, otherwise null. */
  draftAt(row: number, col: number): string | null {
    const session = this.session();
    return session && session.position.row === row && session.position.col === col ? session.text : null;
  }

  /** Whether the draft was rejected as invalid on the last attempt to commit it. */
  isDraftInvalid(): boolean {
    return !!this.session()?.invalid;
  }

  /** Whether the editor should open with its text selected. */
  selectsAll(): boolean {
    return !!this.session()?.selectAll;
  }

  /**
   * Opens the editor on a cell.
   *
   * @param typed The character that triggered the edit; it replaces the
   * cell's content. Null starts from the current value, fully selected.
   * An editor template always starts from the current value.
   * @returns Whether the editor opened.
   */
  open(position: GridCellPosition, typed: string | null): boolean {
    const target = this.deps.cellAt(position);
    if (!target || !this.deps.canEdit(target)) return false;

    const format = resolveFormat(target.row, target.column);
    const current = editTextOf(getCellValue(target.row, target.column), format, this.deps.locale());
    this.deps.activate(position);
    const custom = this.deps.hasEditorTemplate(target.column.id);
    const text = custom ? current : (typed ?? current);
    this.session.set({ position, text, invalid: false, selectAll: typed === null });
    return true;
  }

  /** Replaces the draft text. */
  update(text: string): void {
    this.session.update(session => session && { ...session, text, invalid: false });
  }

  /** Adds a character to the draft: one typed before the editor took focus. */
  append(character: string): void {
    const session = this.session();
    if (session) this.update(session.text + character);
  }

  /** Applies the draft and optionally moves the active cell; an invalid draft stays open. */
  commit(move?: GridMove): void {
    const session = this.session();
    const target = session && this.deps.cellAt(session.position);
    if (!session || !target) return;

    const format = resolveFormat(target.row, target.column);
    const parsed = parseCellInput(session.text, target.column, format, this.deps.locale());
    if (!parsed.valid) {
      this.session.set({ ...session, invalid: true });
      return;
    }
    this.finish(target, parsed.value, move);
  }

  /** Closes the editor without applying the draft. */
  cancel(): void {
    this.close();
  }

  /**
   * Closes the editor because focus left it: applies a valid draft,
   * discards an invalid one. Focus is not pulled back afterwards — the
   * user moved it on purpose.
   */
  leave(): void {
    if (!this.session()) return;
    this.commit();
    this.session.set(null);
    this.deps.releaseFocus();
  }

  /** Ends an edit made in an editor template with the value it produced. */
  private commitValue(value: GridCellValue, move?: GridMove): void {
    const session = this.session();
    const target = session && this.deps.cellAt(session.position);
    if (target) this.finish(target, value, move);
  }

  /** Emits the change, if the value changed, and closes the editor. */
  private finish(target: GridCellRef<T>, value: GridCellValue, move?: GridMove): void {
    const change = createCellChange(target.row, target.column, value);
    if (change) this.deps.emit([change]);
    this.close();
    if (move) this.deps.move(move);
  }

  /** Closes the editor and asks for focus to return to the active cell. */
  private close(): void {
    this.session.set(null);
    this.deps.requestFocus();
  }
}
