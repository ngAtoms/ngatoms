/**
 * @file The data grid. Owns the state (scroll position, viewport
 * size, expansion) and derives from it, through grid-core, exactly which
 * rows, columns and header cells each pane should draw. It never mutates
 * the data it is given and applies no business rules.
 */

import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  GridCellChange,
  GridCellPosition,
  GridCellRect,
  GridCellRejection,
  GridCellResolver,
  GridCellState,
  GridCellValue,
  GridColumn,
  GridColumnNode,
  GridColumnPane,
  GridFilter,
  GridFilters,
  GridHeaderCell,
  GridIndexRange,
  GridMove,
  GridRow,
  GridRowId,
  GridSelection,
  GridSort,
  applyFilters,
  buildRowTree,
  clampPosition,
  clearChanges,
  copyText,
  createCellChange,
  createHistory,
  createNumberFormatter,
  createRowComparator,
  distinctValues,
  editTextOf,
  fillDownChanges,
  fitColumnModel,
  fixedSizeRange,
  flattenRows,
  getCellValue,
  isCellEditable,
  isEmptyValue,
  moveForKey,
  movePosition,
  nextSort,
  parseCellInput,
  parseTsv,
  pasteChanges,
  rangeRect,
  rectEdges,
  rectSize,
  resolveFormat,
  variableSizeRange,
  varianceTone,
  windowedRows,
} from '../grid-core';
import { NgAtomsGridBodyPaneComponent } from './grid-body-pane.component';
import { NgAtomsGridFilterComponent } from './grid-filter.component';
import { NgAtomsGridHeaderPaneComponent } from './grid-header-pane.component';
import {
  GridCellView,
  GridFilterOption,
  GridRenderColumn,
  GridRenderHeaderCell,
  GridRenderRow,
  NGA_GRID,
  NgAtomsGridContext,
} from './grid.context';

/**
 * Who applies filters or sorting. `client`: the grid, to the rows it
 * holds. `external`: the app, which reacts to the change and passes new
 * rows in — the mode to use when data is paged.
 */
export type NgAtomsGridDataMode = 'client' | 'external';

/** A column's filter popover that is currently open. */
interface OpenFilter<T> {
  column: GridColumn<T>;
  anchor: HTMLElement;
}

/** Resolves the state of a cell. Called for every rendered cell, so it must be cheap. */
export type NgAtomsGridCellStateFn<T = unknown> = (
  row: GridRow<T>,
  column: GridColumn<T>,
) => GridCellState | null | undefined;

/** An edit in progress. */
interface EditSession {
  position: GridCellPosition;
  text: string;
  /** The draft was rejected on the last attempt to commit it. */
  invalid: boolean;
  /** Select the whole text when the editor opens, rather than placing the caret at the end. */
  selectAll: boolean;
}

/** Row density presets. */
export type NgAtomsGridDensity = 'compact' | 'comfortable';

const ROW_HEIGHT: Record<NgAtomsGridDensity, number> = { compact: 28, comfortable: 36 };

/** Extra height of a header row over a body row: generous for a single header row, tight for stacked groups. */
const HEADER_ROOM = { single: 12, grouped: 4 };

/** Matches devices whose primary pointer is a finger. */
const COARSE_POINTER = '(pointer: coarse)';

/** Rows rendered above and below the viewport so fast scrolling shows no gaps. */
const ROW_OVERSCAN = 6;

/** Columns rendered left and right of the viewport, for the same reason. */
const COLUMN_OVERSCAN = 2;

/** Text shown for a non-numeric cell value. */
function toText(value: GridCellValue): string {
  return isEmptyValue(value) ? '' : String(value);
}

/** Positions the columns of a pane, optionally limited to a visible range. */
function renderColumns<T>(pane: GridColumnPane<T>, firstIndex: number, range?: GridIndexRange): GridRenderColumn<T>[] {
  const start = range?.start ?? 0;
  const end = range?.end ?? pane.columns.length;
  const out: GridRenderColumn<T>[] = [];
  for (let i = start; i < end; i++) {
    out.push({
      column: pane.columns[i],
      index: firstIndex + i,
      left: pane.offsets[i],
      width: pane.offsets[i + 1] - pane.offsets[i],
    });
  }
  return out;
}

/** Whether a header cell covers at least one column of the range. */
function intersects<T>(cell: GridHeaderCell<T>, range: GridIndexRange): boolean {
  return cell.colStart < range.end && cell.colStart + cell.colSpan > range.start;
}

/** Positions the header cells of a pane, optionally limited to a visible column range. */
function renderHeaderCells<T>(
  pane: GridColumnPane<T>,
  rowHeight: number,
  range?: GridIndexRange,
): GridRenderHeaderCell<T>[] {
  const out: GridRenderHeaderCell<T>[] = [];
  for (const cells of pane.headerRows) {
    for (const cell of cells) {
      if (range && !intersects(cell, range)) continue;
      const left = pane.offsets[cell.colStart];
      out.push({
        key: `${cell.row}:${cell.key}`,
        cell,
        left,
        top: cell.row * rowHeight,
        width: pane.offsets[cell.colStart + cell.colSpan] - left,
        height: cell.rowSpan * rowHeight,
      });
    }
  }
  return out;
}

/** Whether a key press produces a character, as opposed to a command or a shortcut. */
function isTypingKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/**
 * Data grid with hierarchical rows, multi-level column
 * headers, pinned panes and two-axis virtualization.
 */
@Component({
  selector: 'nga-grid',
  standalone: true,
  imports: [NgAtomsGridHeaderPaneComponent, NgAtomsGridBodyPaneComponent, NgAtomsGridFilterComponent],
  templateUrl: './grid.component.html',
  host: {
    class: 'nga-grid',
    '[class.nga-grid--compact]': 'effectiveDensity() === "compact"',
    '[class.nga-grid--comfortable]': 'effectiveDensity() === "comfortable"',
    '[class.nga-grid--scrolled-start]': 'scrollLeft() > 0',
    '[class.nga-grid--scrolled-end]': 'hasContentAfter()',
    '[style.--nga-grid-row-height.px]': 'rowHeight()',
    '[style.--nga-grid-pinned-left.px]': 'columnModel().panes.left.width',
  },
  providers: [{ provide: NGA_GRID, useExisting: NgAtomsGridComponent }],
})
export class NgAtomsGridComponent<T = unknown> implements NgAtomsGridContext<T> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  /** Flat rows; hierarchy comes from each row's `parentId`. */
  readonly rows = input<GridRow<T>[]>([]);
  /** Column groups and leaf columns. */
  readonly columns = input<GridColumnNode<T>[]>([]);
  /** Ids of the expanded rows. */
  readonly expanded = model<ReadonlySet<GridRowId>>(new Set());
  /**
   * Size of the full result when flat data is paged by scroll. Rows not
   * supplied yet render as placeholders.
   */
  readonly rowCount = input<number | null>(null);
  /** Active filters by column id. */
  readonly filters = model<GridFilters<T>>({});
  readonly filterMode = input<NgAtomsGridDataMode>('client');
  /** Sort state. One column at a time. */
  readonly sort = model<GridSort[]>([]);
  readonly sortMode = input<NgAtomsGridDataMode>('client');
  /** Resolves per-cell state: locked, calculated, dirty, invalid, pending, note. */
  readonly cellState = input<NgAtomsGridCellStateFn<T> | null>(null);
  readonly density = input<NgAtomsGridDensity>('compact');
  /** BCP 47 locale for number formatting; defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** Accessible name of the grid. */
  readonly label = input<string>('');

  /** A row with unloaded children was expanded; the app should supply them. */
  readonly rowExpand = output<GridRowId>();
  /** The rendered row window changed; the hook for loading pages by scroll. */
  readonly visibleRangeChange = output<GridIndexRange>();
  /**
   * The user edited cells. The grid does not apply the changes: update
   * your data and pass the new rows in.
   */
  readonly cellsChange = output<GridCellChange[]>();
  /** Pasted values that were skipped: cells that do not accept edits, or text that is not a value for the column. */
  readonly cellsRejected = output<GridCellRejection[]>();
  /** The selected cells changed. Null while the grid has no active cell. */
  readonly selectionChange = output<GridSelection | null>();

  protected readonly scrollTop = signal(0);
  protected readonly scrollLeft = signal(0);
  private readonly viewportWidth = signal(0);
  private readonly viewportHeight = signal(0);

  /** The primary pointer is a finger, so targets need more room. */
  private readonly coarsePointer = signal(false);
  /** Touch screens always get the comfortable preset. */
  protected readonly effectiveDensity = computed<NgAtomsGridDensity>(() =>
    this.coarsePointer() ? 'comfortable' : this.density(),
  );
  protected readonly rowHeight = computed(() => ROW_HEIGHT[this.effectiveDensity()]);
  private readonly formatter = computed(() => createNumberFormatter(this.locale()));

  protected readonly columnModel = computed(() => fitColumnModel(this.columns(), this.viewportWidth()));
  private readonly headerRowHeight = computed(() => {
    const room = this.columnModel().headerDepth === 1 ? HEADER_ROOM.single : HEADER_ROOM.grouped;
    return this.rowHeight() + room;
  });
  private readonly rowTree = computed(() => buildRowTree(this.rows()));
  private readonly columnsById = computed(
    () => new Map(this.columnModel().columns.map(column => [column.id, column])),
  );
  private readonly filterResult = computed(() =>
    this.filterMode() === 'client' ? applyFilters(this.rowTree(), this.filters(), this.columnsById()) : null,
  );
  private readonly comparator = computed(() =>
    this.sortMode() === 'client' ? createRowComparator(this.sort(), this.columnsById()) : null,
  );
  protected readonly rowList = computed(() => {
    const rowCount = this.rowCount();
    if (rowCount !== null) return windowedRows(this.rows(), rowCount);
    return flattenRows(this.rowTree(), {
      expanded: this.expanded(),
      filter: this.filterResult(),
      compare: this.comparator(),
    });
  });

  /** The open filter popover, if any. */
  private readonly openFilterState = signal<OpenFilter<T> | null>(null);
  /**
   * The open popover as a list of zero or one, so the template can key it
   * by column: switching columns then builds a fresh popover instead of
   * reusing one that holds the previous column's draft.
   */
  protected readonly openFilters = computed(() => {
    const open = this.openFilterState();
    return open ? [open] : [];
  });
  /** Entries for the set editor of the open popover. */
  protected readonly filterOptions = computed<GridFilterOption[]>(() => {
    const column = this.openFilterState()?.column;
    if (column?.filter !== 'set') return [];
    return distinctValues(this.rows(), column).map(value => ({
      value,
      label: value === null ? '(Blank)' : this.displayText(value, column),
    }));
  });
  /** No row passes the active filters. */
  protected readonly isFilteredEmpty = computed(() => !!this.filterResult() && this.rowList().length === 0);

  protected readonly headerHeight = computed(() => this.columnModel().headerDepth * this.headerRowHeight());
  protected readonly bodyHeight = computed(() => this.rowList().length * this.rowHeight());
  protected readonly totalWidth = computed(() => {
    const { left, center, right } = this.columnModel().panes;
    return left.width + center.width + right.width;
  });
  protected readonly hasContentAfter = computed(
    () => this.scrollLeft() + this.viewportWidth() < this.totalWidth() - 1,
  );
  protected readonly hasHierarchy = computed(() => this.rowTree().childrenOf.size > 0);

  private readonly rowRange = computed(() =>
    fixedSizeRange(
      this.scrollTop(),
      this.viewportHeight() - this.headerHeight(),
      this.rowHeight(),
      this.rowList().length,
      ROW_OVERSCAN,
    ),
  );

  private readonly centerColumnRange = computed(() => {
    const { left, center, right } = this.columnModel().panes;
    const visibleWidth = this.viewportWidth() - left.width - right.width;
    return variableSizeRange(this.scrollLeft(), visibleWidth, center.offsets, COLUMN_OVERSCAN);
  });

  /**
   * Number of row elements kept in the DOM: the most the viewport can show
   * plus the overscan on both sides.
   */
  private readonly rowPoolSize = computed(() => {
    const bodyHeight = Math.max(0, this.viewportHeight() - this.headerHeight());
    return Math.ceil(bodyHeight / this.rowHeight()) + 1 + ROW_OVERSCAN * 2;
  });

  /**
   * Rows to draw. Each is keyed by its slot in the row pool, not by its
   * id, so scrolling rebinds existing elements instead of destroying and
   * recreating them: the window always maps onto the same set of slots.
   */
  protected readonly renderRows = computed<GridRenderRow<T>[]>(() => {
    const list = this.rowList();
    const height = this.rowHeight();
    const poolSize = this.rowPoolSize();
    const { start, end } = this.rowRange();
    const out: GridRenderRow<T>[] = [];
    for (let index = start; index < end; index++) {
      out.push({ key: index % poolSize, index, top: index * height, entry: list.get(index) });
    }
    return out;
  });

  protected readonly leftColumns = computed(() => renderColumns(this.columnModel().panes.left, 0));
  protected readonly centerColumns = computed(() => {
    const { left, center } = this.columnModel().panes;
    return renderColumns(center, left.columns.length, this.centerColumnRange());
  });
  protected readonly rightColumns = computed(() => {
    const { left, center, right } = this.columnModel().panes;
    return renderColumns(right, left.columns.length + center.columns.length);
  });

  protected readonly leftHeader = computed(() =>
    renderHeaderCells(this.columnModel().panes.left, this.headerRowHeight()),
  );
  protected readonly centerHeader = computed(() =>
    renderHeaderCells(this.columnModel().panes.center, this.headerRowHeight(), this.centerColumnRange()),
  );
  protected readonly rightHeader = computed(() =>
    renderHeaderCells(this.columnModel().panes.right, this.headerRowHeight()),
  );

  /** The active cell as last set; may point outside the grid after rows change. */
  private readonly requestedActiveCell = signal<GridCellPosition | null>(null);
  /** The active cell, kept inside the grid as rows and columns come and go. */
  protected readonly activeCell = computed(() => {
    const requested = this.requestedActiveCell();
    return requested ? clampPosition(requested, this.bounds()) : null;
  });
  /** The far corner of the selection as last set; the active cell is the near one. */
  private readonly requestedRangeEnd = signal<GridCellPosition | null>(null);
  private readonly rangeEnd = computed(() => {
    const requested = this.requestedRangeEnd();
    return requested ? clampPosition(requested, this.bounds()) : null;
  });
  /** The block of selected cells; a single cell when nothing was extended. */
  private readonly selectionRect = computed<GridCellRect | null>(() => {
    const active = this.activeCell();
    return active ? rangeRect({ start: active, end: this.rangeEnd() ?? active }) : null;
  });
  /** More than the active cell is selected. */
  private readonly hasRange = computed(() => {
    const rect = this.selectionRect();
    return !!rect && rectSize(rect) > 1;
  });
  private readonly selection = computed<GridSelection | null>(() => {
    const active = this.activeCell();
    const rect = this.selectionRect();
    if (!active || !rect) return null;

    const rowIds: GridRowId[] = [];
    const list = this.rowList();
    for (let index = rect.top; index <= rect.bottom; index++) {
      const entry = list.get(index);
      if (entry?.kind === 'row') rowIds.push(entry.row.id);
    }
    const columnIds = this.columnModel().columns.slice(rect.left, rect.right + 1).map(column => column.id);
    return { range: { start: active, end: this.rangeEnd() ?? active }, rowIds, columnIds };
  });
  private readonly editSession = signal<EditSession | null>(null);
  /** Batches the user produced, for undo and redo. */
  private readonly history = createHistory();
  /** The mouse went down on a cell and has not been released since. */
  private selecting = false;
  private readonly bounds = computed(() => ({
    rowCount: this.rowList().length,
    columnCount: this.columnModel().columns.length,
    pageSize: Math.floor((this.viewportHeight() - this.headerHeight()) / this.rowHeight()),
  }));
  /**
   * Set when the grid itself removes the focused element (closing the
   * editor), so the next render knows focus belongs back on the active cell.
   */
  private focusOwed = false;
  /** The last activation landed on the cell that was already active. */
  private reactivated = false;

  constructor() {
    effect(() => this.visibleRangeChange.emit(this.rowRange()));
    effect(() => {
      const selection = this.selection();
      untracked(() => this.selectionChange.emit(selection));
    });
    afterRenderEffect(() => {
      this.activeCell();
      this.editSession();
      this.renderRows();
      this.centerColumns();
      this.syncFocus();
    });
    afterNextRender(() => this.observeViewportSize());
    this.observePointer();
  }

  /** @inheritdoc */
  headerDepth(): number {
    return this.columnModel().headerDepth;
  }

  /** @inheritdoc */
  cell(row: GridRow<T>, column: GridColumn<T>): GridCellView {
    const value = getCellValue(row, column);
    const numeric = column.type === 'number';
    const state = this.cellState()?.(row, column) ?? null;
    return {
      text: numeric ? this.formatter().format(value, resolveFormat(row, column)) : toText(value),
      numeric,
      tone: column.variance ? varianceTone(value, row) : null,
      editable: isCellEditable(column, state),
      state,
    };
  }

  /** @inheritdoc */
  isActive(row: number, col: number): boolean {
    const active = this.activeCell();
    return !!active && active.row === row && active.col === col;
  }

  /** @inheritdoc */
  activate(row: number, col: number): void {
    this.reactivated = this.isActive(row, col) && !this.hasRange();
    this.requestedRangeEnd.set(null);
    this.requestedActiveCell.set({ row, col });
    this.scrollIntoView({ row, col });
  }

  /** @inheritdoc */
  pressCell(row: number, col: number, extend: boolean): void {
    this.selecting = true;
    if (extend && this.activeCell()) this.extendTo({ row, col });
    else this.activate(row, col);
  }

  /** @inheritdoc */
  dragOverCell(row: number, col: number, pressed: boolean): void {
    if (!pressed) this.selecting = false;
    else if (this.selecting) this.extendTo({ row, col });
  }

  /** @inheritdoc */
  selectionEdges(row: number, col: number): string | null {
    const rect = this.selectionRect();
    if (!rect || !this.hasRange()) return null;
    return rectEdges(rect, { row, col })?.join(' ') ?? null;
  }

  /** Forgets the undo history. Call it after loading different data. */
  clearHistory(): void {
    this.history.clear();
  }

  /** @inheritdoc */
  tapCell(row: number, col: number): void {
    if (this.coarsePointer() && this.reactivated) this.startEdit(row, col);
  }

  /** @inheritdoc */
  editDraft(row: number, col: number): string | null {
    const session = this.editSession();
    return session && session.position.row === row && session.position.col === col ? session.text : null;
  }

  /** @inheritdoc */
  isDraftInvalid(): boolean {
    return !!this.editSession()?.invalid;
  }

  /** @inheritdoc */
  startEdit(row: number, col: number): void {
    this.openEditor({ row, col }, null);
  }

  /** @inheritdoc */
  updateDraft(text: string): void {
    this.editSession.update(session => session && { ...session, text, invalid: false });
  }

  /** @inheritdoc */
  commitEdit(move?: GridMove): void {
    const session = this.editSession();
    const target = session && this.cellAt(session.position);
    if (!session || !target) return;

    const format = resolveFormat(target.row, target.column);
    const parsed = parseCellInput(session.text, target.column, format, this.locale());
    if (!parsed.valid) {
      this.editSession.set({ ...session, invalid: true });
      return;
    }

    const change = createCellChange(target.row, target.column, parsed.value);
    if (change) this.emitChanges([change]);
    this.closeEditor();
    if (move) this.moveActiveCell(move);
  }

  /** @inheritdoc */
  cancelEdit(): void {
    this.closeEditor();
  }

  /**
   * @inheritdoc
   * Focus is not pulled back afterwards: the user moved it on purpose.
   */
  leaveEdit(): void {
    if (!this.editSession()) return;
    this.commitEdit();
    this.editSession.set(null);
    this.focusOwed = false;
  }

  /** @inheritdoc */
  sortDirection(columnId: string): 'asc' | 'desc' | null {
    return this.sort().find(entry => entry.columnId === columnId)?.direction ?? null;
  }

  /** @inheritdoc */
  toggleSort(column: GridColumn<T>): void {
    this.sort.set(nextSort(this.sort(), column.id));
  }

  /** @inheritdoc */
  hasFilter(columnId: string): boolean {
    return columnId in this.filters();
  }

  /** @inheritdoc */
  openFilterColumn(): string | null {
    return this.openFilterState()?.column.id ?? null;
  }

  /**
   * @inheritdoc
   * Pressing the button of the column that is already open closes it.
   */
  openFilter(column: GridColumn<T>, anchor: HTMLElement): void {
    const isOpen = this.openFilterColumn() === column.id;
    this.openFilterState.set(isOpen ? null : { column, anchor });
  }

  /** Removes every filter. */
  clearFilters(): void {
    this.filters.set({});
  }

  /** Stores (or removes, when null) the filter of a column and closes its popover. */
  protected applyFilter(columnId: string, filter: GridFilter<T> | null): void {
    const next = { ...this.filters() };
    if (filter) next[columnId] = filter;
    else delete next[columnId];
    this.filters.set(next);
    this.closeFilter(columnId);
  }

  /**
   * Closes the filter popover of a column without changing the filters.
   * Ignored when another column's popover has opened in the meantime, so
   * a late dismissal of the old one cannot close the new one.
   */
  protected closeFilter(columnId: string): void {
    if (this.openFilterColumn() === columnId) this.openFilterState.set(null);
  }

  /** Display text of a raw value in a column, without row-level overrides. */
  private displayText(value: GridCellValue, column: GridColumn<T>): string {
    return column.type === 'number' ? this.formatter().format(value, column.format) : toText(value);
  }

  /**
   * @inheritdoc
   * Expanding a row whose children are not loaded also emits `rowExpand`,
   * and the row stays marked as expanded so it opens when they arrive.
   */
  toggleRow(row: GridRow<T>): void {
    const next = new Set(this.expanded());
    if (next.delete(row.id)) {
      this.expanded.set(next);
      return;
    }
    next.add(row.id);
    this.expanded.set(next);

    const childrenLoaded = !!this.rowTree().childrenOf.get(row.id)?.length;
    if (row.hasChildren && !childrenLoaded) this.rowExpand.emit(row.id);
  }

  /**
   * Keyboard handling for the cell area: navigation, tree expand and
   * collapse, opening the editor and clearing a cell. Keys pressed in the
   * header are not handled here. The editor handles its own keys; the ones
   * that still arrive with an editor open were typed before it took focus.
   */
  protected onKeydown(event: KeyboardEvent): void {
    const active = this.activeCell();
    const inHeader = !!(event.target as HTMLElement).closest('.nga-grid__header');
    if (!active || inHeader) return;

    const session = this.editSession();
    if (session) {
      if (isTypingKey(event)) {
        this.updateDraft(session.text + event.key);
        event.preventDefault();
      }
      return;
    }

    const handled =
      this.handleTreeKey(event.key, active) ||
      this.handleCommandKey(event) ||
      this.handleMoveKey(event, active) ||
      this.handleEditKey(event, active);
    if (handled) event.preventDefault();
  }

  /** Puts the selection on the clipboard as tab-separated text. */
  protected onCopy(event: ClipboardEvent): void {
    const rect = this.clipboardRect(event);
    const text = rect && copyText(rect, this.resolveCell, this.locale());
    if (text === null) return;
    event.clipboardData?.setData('text/plain', text);
    event.preventDefault();
  }

  /** Copies the selection, then clears its editable cells. */
  protected onCut(event: ClipboardEvent): void {
    this.onCopy(event);
    if (event.defaultPrevented) this.clearSelection();
  }

  /**
   * Turns pasted text into one batch of changes, starting at the
   * selection. Cells that cannot take their value are reported through
   * `cellsRejected`, and the pasted block becomes the selection.
   */
  protected onPaste(event: ClipboardEvent): void {
    const rect = this.clipboardRect(event);
    const text = event.clipboardData?.getData('text/plain');
    if (!rect || !text) return;
    event.preventDefault();

    const result = pasteChanges(parseTsv(text), rect, this.bounds(), this.resolveCell, this.locale());
    if (!result) return;
    this.emitChanges(result.changes);
    if (result.rejected.length) this.cellsRejected.emit(result.rejected);
    if (result.rect) {
      this.requestedActiveCell.set({ row: result.rect.top, col: result.rect.left });
      this.requestedRangeEnd.set({ row: result.rect.bottom, col: result.rect.right });
    }
  }

  /** Gives the grid an active cell the first time it receives focus. */
  protected onFocusIn(): void {
    if (!this.activeCell()) this.requestedActiveCell.set({ row: 0, col: 0 });
  }

  /** Mirrors the scroll position into signals, which drives virtualization. */
  protected onScroll(): void {
    const element = this.viewport().nativeElement;
    this.scrollTop.set(element.scrollTop);
    this.scrollLeft.set(element.scrollLeft);
  }

  /**
   * In the tree column, Right opens a collapsed branch and Left closes an
   * open one, before either key moves the active cell.
   *
   * @returns Whether the key was used.
   */
  private handleTreeKey(key: string, active: GridCellPosition): boolean {
    const entry = this.rowList().get(active.row);
    const column = this.columnModel().columns[active.col];
    if (entry.kind !== 'row' || !column.tree || !entry.hasChildren) return false;

    const opens = key === 'ArrowRight' && !entry.expanded;
    const closes = key === 'ArrowLeft' && entry.expanded;
    if (opens || closes) this.toggleRow(entry.row);
    return opens || closes;
  }

  /**
   * Moves the active cell for a navigation key.
   *
   * @returns Whether the key was a navigation key.
   */
  private handleMoveKey(event: KeyboardEvent, active: GridCellPosition): boolean {
    const move = moveForKey(event.key, event.ctrlKey || event.metaKey);
    if (!move) return false;
    const from = event.shiftKey ? (this.rangeEnd() ?? active) : active;
    const next = movePosition(from, move, this.bounds());
    if (next && event.shiftKey) {
      this.extendTo(next);
      this.scrollIntoView(next);
    } else if (next) this.activate(next.row, next.col);
    return true;
  }

  /**
   * Shortcuts that act on the selection: Escape collapses it to the
   * active cell, Ctrl+A selects everything, Ctrl+D fills down, Ctrl+Z
   * undoes and Ctrl+Y or Ctrl+Shift+Z redoes. Cmd stands in for Ctrl.
   *
   * @returns Whether the key was used.
   */
  private handleCommandKey(event: KeyboardEvent): boolean {
    if (event.key === 'Escape' && this.hasRange()) {
      this.requestedRangeEnd.set(null);
      return true;
    }
    if (!event.ctrlKey && !event.metaKey) return false;

    const key = event.key.toLowerCase();
    if (key === 'a') this.selectAll();
    else if (key === 'd') this.fillDown();
    else if (key === 'y' || (key === 'z' && event.shiftKey)) this.replay(this.history.redo());
    else if (key === 'z') this.replay(this.history.undo());
    else return false;
    return true;
  }

  /**
   * Opens the editor (Enter, F2, or simply typing) or clears the cell
   * (Delete, Backspace).
   *
   * @returns Whether the key was used.
   */
  private handleEditKey(event: KeyboardEvent, active: GridCellPosition): boolean {
    if (event.key === 'Enter' || event.key === 'F2') return this.openEditor(active, null);
    if (isTypingKey(event)) return this.openEditor(active, event.key);
    if (event.key === 'Delete' || event.key === 'Backspace') return this.clearSelection();
    return false;
  }

  /** Moves the far corner of the selection, leaving the active cell where it is. */
  private extendTo(position: GridCellPosition): void {
    this.reactivated = false;
    this.requestedRangeEnd.set(position);
  }

  /** Selects every cell, from the first to the last. */
  private selectAll(): void {
    const { rowCount, columnCount } = this.bounds();
    this.requestedActiveCell.set({ row: 0, col: 0 });
    this.requestedRangeEnd.set({ row: rowCount - 1, col: columnCount - 1 });
  }

  /** Emits a batch the user produced and remembers it for undo. */
  private emitChanges(changes: GridCellChange[]): void {
    if (!changes.length) return;
    this.history.record(changes);
    this.cellsChange.emit(changes);
  }

  /** Emits a batch that comes from the history, which already holds it. */
  private replay(changes: GridCellChange[] | null): void {
    if (changes) this.cellsChange.emit(changes);
  }

  /** Copies the first row of the selection into the rows below it. */
  private fillDown(): void {
    const rect = this.selectionRect();
    const changes = rect && fillDownChanges(rect, this.resolveCell);
    if (changes) this.emitChanges(changes);
  }

  /**
   * The selection a clipboard event applies to, or null when the event
   * belongs to something else: the header, a text field, an open editor.
   */
  private clipboardRect(event: ClipboardEvent): GridCellRect | null {
    const elsewhere = !!(event.target as HTMLElement).closest('.nga-grid__header, input, textarea');
    return elsewhere || this.editSession() ? null : this.selectionRect();
  }

  /** Looks a display position up for batch edits. */
  private readonly resolveCell: GridCellResolver<T> = position => {
    const target = this.cellAt(position);
    return target && { ...target, editable: this.canEdit(target) };
  };

  /** The row and column at a display position, or null for a placeholder row. */
  private cellAt(position: GridCellPosition): { row: GridRow<T>; column: GridColumn<T> } | null {
    const entry = this.rowList().get(position.row);
    const column = this.columnModel().columns[position.col];
    return entry?.kind === 'row' && column ? { row: entry.row, column } : null;
  }

  /** Whether the cell at a position accepts edits. */
  private canEdit(target: { row: GridRow<T>; column: GridColumn<T> }): boolean {
    return isCellEditable(target.column, this.cellState()?.(target.row, target.column));
  }

  /**
   * Opens the editor on a cell.
   *
   * @param typed The character that triggered the edit; it replaces the
   * cell's content. Null starts from the current value, fully selected.
   * @returns Whether the editor opened.
   */
  private openEditor(position: GridCellPosition, typed: string | null): boolean {
    const target = this.cellAt(position);
    if (!target || !this.canEdit(target)) return false;

    const format = resolveFormat(target.row, target.column);
    const current = editTextOf(getCellValue(target.row, target.column), format, this.locale());
    this.activate(position.row, position.col);
    this.editSession.set({ position, text: typed ?? current, invalid: false, selectAll: typed === null });
    return true;
  }

  /** Closes the editor and asks for focus to return to the active cell. */
  private closeEditor(): void {
    this.editSession.set(null);
    this.focusOwed = true;
  }

  /**
   * Emits one batch that empties the editable cells of the selection.
   *
   * @returns Whether there was a selection to clear.
   */
  private clearSelection(): boolean {
    const rect = this.selectionRect();
    const changes = rect && clearChanges(rect, this.resolveCell);
    if (changes) this.emitChanges(changes);
    return !!rect;
  }

  /** Moves the active cell by one step. */
  private moveActiveCell(move: GridMove): void {
    const active = this.activeCell();
    const next = active && movePosition(active, move, this.bounds());
    if (next) this.activate(next.row, next.col);
  }

  /**
   * Scrolls just enough to bring a cell fully into view.
   * Pinned columns are always visible, so only center columns scroll
   * sideways, within the strip left between the pinned panes.
   */
  private scrollIntoView(position: GridCellPosition): void {
    const element = this.viewport().nativeElement;
    const { left, center, right } = this.columnModel().panes;

    const top = position.row * this.rowHeight();
    const visibleHeight = element.clientHeight - this.headerHeight();
    if (top < element.scrollTop) element.scrollTop = top;
    else if (top + this.rowHeight() > element.scrollTop + visibleHeight) {
      element.scrollTop = top + this.rowHeight() - visibleHeight;
    }

    const centerIndex = position.col - left.columns.length;
    if (centerIndex < 0 || centerIndex >= center.columns.length) return;
    const start = center.offsets[centerIndex];
    const end = center.offsets[centerIndex + 1];
    const visibleWidth = element.clientWidth - left.width - right.width;
    if (start < element.scrollLeft) element.scrollLeft = start;
    else if (end > element.scrollLeft + visibleWidth) element.scrollLeft = end - visibleWidth;
  }

  /**
   * Keeps DOM focus on the right element after each render: the editor
   * while editing, otherwise the active cell — or the viewport when that
   * cell is scrolled out of the rendered window, since row elements are
   * recycled and would otherwise keep focus while showing another row.
   * Focus is never taken from outside the grid, nor from header controls.
   */
  private syncFocus(): void {
    const host = this.viewport().nativeElement;
    const focused = this.document.activeElement as HTMLElement | null;
    const owed = this.focusOwed;
    this.focusOwed = false;

    const focusInCells = !!focused && host.contains(focused) && !focused.closest('.nga-grid__header');
    if (!focusInCells && !owed) return;

    const editor = host.querySelector<HTMLInputElement>('.nga-grid__editor');
    if (editor) {
      if (focused !== editor) this.focusEditor(editor);
      return;
    }
    const target = host.querySelector<HTMLElement>('.nga-grid__cell--active') ?? host;
    if (focused !== target) target.focus({ preventScroll: true });
  }

  /** Focuses the editor, selecting its text or placing the caret at the end. */
  private focusEditor(editor: HTMLInputElement): void {
    editor.focus({ preventScroll: true });
    if (this.editSession()?.selectAll) editor.select();
    else editor.setSelectionRange(editor.value.length, editor.value.length);
  }

  /** Tracks the size of the scroll viewport for as long as the grid lives. */
  private observeViewportSize(): void {
    const element = this.viewport().nativeElement;
    const observer = new ResizeObserver(() => {
      this.viewportWidth.set(element.clientWidth);
      this.viewportHeight.set(element.clientHeight);
    });
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /** Follows the primary pointer type, which changes when a tablet docks or a touch laptop folds. */
  private observePointer(): void {
    const query = this.document.defaultView?.matchMedia?.(COARSE_POINTER);
    if (!query) return;
    /** Mirrors the media query into the signal. */
    const sync = (): void => this.coarsePointer.set(query.matches);
    sync();
    query.addEventListener('change', sync);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', sync));
  }
}
