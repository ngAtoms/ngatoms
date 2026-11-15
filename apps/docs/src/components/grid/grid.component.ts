/**
 * @file The data grid. Owns the layout state (scroll position, viewport
 * size, expansion, column widths) and derives from it, through grid-core,
 * exactly which rows, columns and header cells each pane should draw.
 * Selection, editing, batch edits, row reordering, the header keys and
 * focus each have their own collaborator; this class wires them together
 * and dispatches the keyboard. It never mutates the data it is given and
 * applies no business rules.
 */

import {
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  contentChildren,
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
  GridBatchRejection,
  GridCellChange,
  GridCellPosition,
  GridCellRejection,
  GridCellState,
  GridCellValue,
  GridColumn,
  GridColumnNode,
  GridExportOptions,
  GridFilter,
  GridFilters,
  GridIndexRange,
  GridMove,
  GridRow,
  GridRowId,
  GridRowMove,
  GridSelection,
  GridSort,
  applyFilters,
  buildRowTree,
  clampColumnWidth,
  columnHeaderPaths,
  createNumberFormatter,
  createRowComparator,
  distinctValues,
  exportDelimited,
  fitColumnModel,
  fixedSizeRange,
  flattenRows,
  getCellValue,
  isCellEditable,
  moveForKey,
  movePosition,
  nextSort,
  resolveFormat,
  variableSizeRange,
  varianceTone,
  windowedRows,
} from '../grid-core';
import { GridBatchController } from './grid-batch-edits';
import { NgAtomsGridBodyPaneComponent } from './grid-body-pane.component';
import { trackDragSelect } from './grid-drag-select';
import { GridCellRef, GridEditController } from './grid-editing';
import { NgAtomsGridFilterComponent } from './grid-filter.component';
import { GridFocusController } from './grid-focus';
import { NgAtomsGridHeaderPaneComponent } from './grid-header-pane.component';
import { GridHeaderKeysController } from './grid-header-keys';
import { measureColumnWidth } from './grid-measure';
import { INTERACTIVE_SELECTOR, isTypingKey, renderColumns, renderHeaderCells, toText } from './grid-render';
import { GridRowReorderController } from './grid-row-reorder';
import { GridSelectionController } from './grid-selection';
import {
  NgAtomsGridCellContext,
  NgAtomsGridCellDirective,
  NgAtomsGridEditorContext,
  NgAtomsGridEditorDirective,
} from './grid-templates';
import {
  GridCellView,
  GridFilterOption,
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

/** How `exportText` writes the grid. */
export interface NgAtomsGridExportOptions extends GridExportOptions {
  /**
   * `raw` writes values as they are stored, which other programs read
   * back unchanged. `formatted` writes them as the grid shows them.
   * Defaults to `raw`.
   */
  values?: 'raw' | 'formatted';
}

/** Row density presets. */
export type NgAtomsGridDensity = 'compact' | 'comfortable';

const ROW_HEIGHT: Record<NgAtomsGridDensity, number> = { compact: 28, comfortable: 36 };

/** Extra height of a header row over a body row: generous for a single header row, tight for stacked groups. */
const HEADER_ROOM = { single: 12, grouped: 4 };

/** Matches devices whose primary pointer is a finger. */
const COARSE_POINTER = '(pointer: coarse)';

/** Vertical room a wrapped cell keeps free around its text, in px. */
const WRAP_PADDING = 10;

/** Height of one line of wrapped cell text, in px. */
const WRAP_LINE_HEIGHT = 18;

/** Rows rendered above and below the viewport so fast scrolling shows no gaps. */
const ROW_OVERSCAN = 6;

/** Counts grid instances so element ids stay unique when several grids share a page. */
let nextGridInstance = 0;

/** Keeps a DOM id token to characters that are safe unescaped. */
function domToken(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '_');
}

/** Columns rendered left and right of the viewport, for the same reason. */
const COLUMN_OVERSCAN = 2;

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
    '[class.nga-grid--fit-rows]': 'fitRows()',
    '[style.--nga-grid-row-height.px]': 'rowHeightPx()',
    '[style.--nga-grid-wrap-lines]': 'wrapLines()',
    '[style.--nga-grid-pinned-left.px]': 'columnModel().panes.left.width',
  },
  providers: [{ provide: NGA_GRID, useExisting: NgAtomsGridComponent }],
})
export class NgAtomsGridComponent<T = unknown> implements NgAtomsGridContext<T> {
  private readonly domPrefix = `nga-grid-${nextGridInstance++}`;
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
  /** Widths the user gave columns by dragging, by column id. They win over `column.width`. */
  readonly columnWidths = model<Readonly<Record<string, number>>>({});
  /**
   * Shows a handle on each row to drag it by. The grid does not reorder
   * rows: it emits `rowMove`. Handles are hidden while the grid sorts
   * the rows itself, and for data paged by scroll.
   */
  readonly rowReorder = input(false);
  readonly density = input<NgAtomsGridDensity>('compact');
  /** Height of a row in px. Overrides the density preset; use it with columns that `wrap`. */
  readonly rowHeight = input<number | null>(null);
  /**
   * Makes the grid as tall as its rows, with no vertical scrolling — a
   * plain table. Every row is rendered, so keep it to short lists.
   */
  readonly fitRows = input(false);
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
  /** The user dragged a row onto another, or moved it with Alt+↑ / Alt+↓ (⌥↑ / ⌥↓ on a Mac). Move it in your data and pass rows back. */
  readonly rowMove = output<GridRowMove>();
  /** Pasted values that were skipped: cells that do not accept edits, or text that is not a value for the column. */
  readonly cellsRejected = output<GridCellRejection[]>();
  /** A copy, cut, paste, clear or fill was not carried out because it would touch more cells than one batch may hold. */
  readonly batchRejected = output<GridBatchRejection>();
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
  protected readonly rowHeightPx = computed(() => this.rowHeight() ?? ROW_HEIGHT[this.effectiveDensity()]);
  /** Lines of text a wrapped cell can show at the current row height. */
  protected readonly wrapLines = computed(() =>
    Math.max(1, Math.floor((this.rowHeightPx() - WRAP_PADDING) / WRAP_LINE_HEIGHT)),
  );
  private readonly formatter = computed(() => createNumberFormatter(this.locale()));

  private readonly widthsById = computed(() => new Map(Object.entries(this.columnWidths())));
  protected readonly columnModel = computed(() =>
    fitColumnModel(this.columns(), this.viewportWidth(), this.widthsById()),
  );
  /** Leaf column header ids, keyed by column id. Built with the same id the header template writes. */
  private readonly leafHeaderIds = computed(() => {
    const ids = new Map<string, string>();
    const { left, center, right } = this.columnModel().panes;
    for (const pane of [left, center, right]) {
      for (const cells of pane.headerRows) {
        for (const cell of cells) {
          if (cell.column) ids.set(cell.column.id, this.headerDomId(pane.id, cell.key, cell.row));
        }
      }
    }
    return ids;
  });
  private readonly headerRowHeight = computed(() => {
    const room = this.columnModel().headerDepth === 1 ? HEADER_ROOM.single : HEADER_ROOM.grouped;
    return this.rowHeightPx() + room;
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
  protected readonly bodyHeight = computed(() => this.rowList().length * this.rowHeightPx());

  protected readonly totalWidth = computed(() => {
    const { left, center, right } = this.columnModel().panes;
    return left.width + center.width + right.width;
  });
  protected readonly hasContentAfter = computed(
    () => this.scrollLeft() + this.viewportWidth() < this.totalWidth() - 1,
  );
  /** True when any row has children. A flat grid stays `role="grid"` and omits `aria-level`. */
  hasHierarchy(): boolean {
    return this.rowTree().childrenOf.size > 0;
  }

  private readonly rowRange = computed(() =>
    fixedSizeRange(
      this.scrollTop(),
      this.viewportHeight() - this.headerHeight(),
      this.rowHeightPx(),
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
    return Math.ceil(bodyHeight / this.rowHeightPx()) + 1 + ROW_OVERSCAN * 2;
  });

  /**
   * Rows to draw. Each is keyed by its slot in the row pool, not by its
   * id, so scrolling rebinds existing elements instead of destroying and
   * recreating them: the window always maps onto the same set of slots.
   */
  protected readonly renderRows = computed<GridRenderRow<T>[]>(() => {
    const list = this.rowList();
    const height = this.rowHeightPx();
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

  private readonly cellDirectives = contentChildren(NgAtomsGridCellDirective);
  private readonly editorDirectives = contentChildren(NgAtomsGridEditorDirective);
  private readonly cellTemplates = computed(
    () => new Map(this.cellDirectives().map(slot => [slot.columnId(), slot.template])),
  );
  private readonly editorTemplates = computed(
    () => new Map(this.editorDirectives().map(slot => [slot.columnId(), slot.template])),
  );

  private readonly bounds = computed(() => ({
    rowCount: this.rowList().length,
    columnCount: this.columnModel().columns.length,
    pageSize: Math.floor((this.viewportHeight() - this.headerHeight()) / this.rowHeightPx()),
  }));

  /** Places DOM focus after each render, and scrolls cells into view. */
  private readonly focus = new GridFocusController<T>({
    viewport: () => this.viewport().nativeElement,
    document: this.document,
    rowHeight: () => this.rowHeightPx(),
    headerHeight: () => this.headerHeight(),
    columnModel: () => this.columnModel(),
    headerColumn: () => this.headerKeys.focused(),
    selectsAllOnEdit: () => this.editing.selectsAll(),
  });

  /** The active cell and the selected block. */
  private readonly selected = new GridSelectionController<T>({
    bounds: () => this.bounds(),
    rowList: () => this.rowList(),
    columns: () => this.columnModel().columns,
  });
  protected readonly activeCell = this.selected.activeCell;

  /** Copy, cut, paste, clear, fill, undo and redo over the selection. */
  protected readonly batch = new GridBatchController<T>({
    rect: () => this.selected.rect(),
    active: () => this.selected.activeCell(),
    bounds: () => this.bounds(),
    cellAt: position => this.cellAt(position),
    canEdit: cell => this.canEdit(cell),
    locale: () => this.locale(),
    isEditing: () => this.editing.isOpen(),
    select: rect => this.selected.select(rect),
    changed: changes => this.cellsChange.emit(changes),
    rejected: rejections => this.cellsRejected.emit(rejections),
    refused: rejection => this.batchRejected.emit(rejection),
  });

  /** The cell being edited, if any. */
  private readonly editing = new GridEditController<T>({
    cellAt: position => this.cellAt(position),
    canEdit: cell => this.canEdit(cell),
    locale: () => this.locale(),
    hasEditorTemplate: columnId => this.editorTemplates().has(columnId),
    emit: changes => this.batch.emit(changes),
    activate: position => this.activate(position.row, position.col),
    move: move => this.moveActiveCell(move),
    requestFocus: () => this.focus.request(),
    releaseFocus: () => this.focus.release(),
  });

  /** Dragging rows by their handle, and moving them from the keyboard. */
  private readonly reorder = new GridRowReorderController<T>({
    enabled: () => this.canDragRows(),
    viewport: () => this.viewport().nativeElement,
    rowList: () => this.rowList(),
    rowTree: () => this.rowTree(),
    rowHeight: () => this.rowHeightPx(),
    headerHeight: () => this.headerHeight(),
    allowInside: () => this.hasHierarchy(),
    active: () => this.selected.activeCell(),
    activate: position => this.activate(position.row, position.col),
    moved: move => this.rowMove.emit(move),
  });
  protected readonly dropIndicator = this.reorder.indicator;

  /** Keyboard focus on the column headers. */
  private readonly headerKeys = new GridHeaderKeysController<T>({
    columnModel: () => this.columnModel(),
    scrollColumnIntoView: col => this.focus.scrollColumnIntoView(col),
    resize: (column, width) => this.resizeColumn(column, width),
    toggleSort: column => this.toggleSort(column),
    openFilter: (column, anchor) => this.openFilter(column, anchor),
    active: () => this.selected.activeCell(),
    activate: position => this.activate(position.row, position.col),
    requestFocus: () => this.focus.request(),
  });

  constructor() {
    effect(() => this.visibleRangeChange.emit(this.rowRange()));
    effect(() => {
      const selection = this.selected.selection();
      untracked(() => this.selectionChange.emit(selection));
    });
    afterRenderEffect(() => {
      this.headerKeys.focused();
      this.selected.activeCell();
      this.editing.position();
      this.renderRows();
      this.centerColumns();
      this.focus.sync();
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
    return this.selected.isActive(row, col);
  }

  /**
   * @inheritdoc
   * An edit in progress on another cell is closed first, keyboard focus
   * leaves the header, and the cell is scrolled into view.
   */
  activate(row: number, col: number): void {
    const editing = this.editing.position();
    if (editing && (editing.row !== row || editing.col !== col)) this.editing.leave();
    this.headerKeys.blur();
    this.selected.setActive({ row, col });
    this.focus.scrollIntoView({ row, col });
  }

  /** @inheritdoc */
  pressCell(row: number, col: number, extend: boolean): void {
    this.selected.beginDrag();
    if (extend && this.selected.activeCell()) this.selected.extendTo({ row, col });
    else this.activate(row, col);
    trackDragSelect(
      this.viewport().nativeElement,
      () => this.headerHeight(),
      cell => this.selected.dragOverElement(cell, this.headerDepth()),
    );
  }

  /** @inheritdoc */
  dragOverCell(row: number, col: number, pressed: boolean): void {
    this.selected.dragOver({ row, col }, pressed);
  }

  /** @inheritdoc */
  selectionEdges(row: number, col: number): string | null {
    return this.selected.edges(row, col);
  }

  /** @inheritdoc */
  headerDomId(pane: string, key: string, row: number): string {
    return `${this.domPrefix}-h-${domToken(pane)}-${row}-${domToken(key)}`;
  }

  /** @inheritdoc */
  rowHeaderDomId(rowId: GridRowId): string {
    return `${this.domPrefix}-r-${domToken(String(rowId))}`;
  }

  /** @inheritdoc */
  cellValueDomId(rowId: GridRowId, columnId: string): string {
    return `${this.domPrefix}-v-${domToken(String(rowId))}-${domToken(columnId)}`;
  }

  /** @inheritdoc */
  columnHeaderDomId(columnId: string): string | null {
    return this.leafHeaderIds().get(columnId) ?? null;
  }

  /**
   * Text of the first column. It is the row's accessible label, kept
   * outside the grid so a horizontal scroll cannot drop the id.
   */
  protected rowHeaderText(row: GridRow<T>): string {
    const column = this.columnModel().columns[0];
    return column ? this.cell(row, column).text : '';
  }

  /** @inheritdoc */
  cellLabelledBy(rowId: GridRowId, columnId: string, rowHeader: boolean): string | null {
    const columnHeaderId = this.columnHeaderDomId(columnId);
    const valueId = this.cellValueDomId(rowId, columnId);
    const ids = rowHeader
      ? [columnHeaderId, valueId]
      : [this.rowHeaderDomId(rowId), columnHeaderId, valueId];
    const present = ids.filter((id): id is string => !!id);
    return present.length ? present.join(' ') : null;
  }

  /** @inheritdoc */
  cellTemplate(columnId: string): TemplateRef<NgAtomsGridCellContext<T>> | null {
    return (this.cellTemplates().get(columnId) as TemplateRef<NgAtomsGridCellContext<T>> | undefined) ?? null;
  }

  /** @inheritdoc */
  editorTemplate(columnId: string): TemplateRef<NgAtomsGridEditorContext<T>> | null {
    return (this.editorTemplates().get(columnId) as TemplateRef<NgAtomsGridEditorContext<T>> | undefined) ?? null;
  }

  /** @inheritdoc */
  editorContext(): NgAtomsGridEditorContext<T> | null {
    return this.editing.context();
  }

  /** @inheritdoc */
  canDragRows(): boolean {
    const sorting = this.sortMode() === 'client' && this.sort().length > 0;
    return this.rowReorder() && !sorting && this.rowCount() === null;
  }

  /** @inheritdoc */
  isDraggedRow(row: number): boolean {
    return this.reorder.isDragged(row);
  }

  /** @inheritdoc */
  startRowDrag(row: number, event: PointerEvent): void {
    this.reorder.start(row, event);
  }

  /** @inheritdoc */
  headerKey(column: GridColumn<T>, event: KeyboardEvent): void {
    if (this.headerKeys.handle(column, event)) event.preventDefault();
  }

  /** @inheritdoc */
  resizeColumn(column: GridColumn<T>, width: number): void {
    const clamped = clampColumnWidth(column, width);
    this.columnWidths.update(widths => ({ ...widths, [column.id]: clamped }));
  }

  /** @inheritdoc */
  autoSizeColumn(column: GridColumn<T>): void {
    const index = this.columnModel().indexById.get(column.id);
    if (index === undefined) return;
    this.resizeColumn(column, measureColumnWidth(this.viewport().nativeElement, column.id, index));
  }

  /**
   * The rows on show as delimited text — CSV unless another delimiter
   * is given — with every visible column and a header line. Collapsed
   * and filtered-out rows are not included.
   */
  exportText(options: NgAtomsGridExportOptions = {}): string {
    const formatted = options.values === 'formatted';
    return exportDelimited(
      this.rowList(),
      this.columnModel().columns,
      columnHeaderPaths(this.columns()),
      options,
      formatted ? (row, column) => this.cell(row, column).text : undefined,
    );
  }

  /** Forgets the undo history. Call it after loading different data. */
  clearHistory(): void {
    this.batch.clearHistory();
  }

  /** @inheritdoc */
  tapCell(row: number, col: number): void {
    if (this.coarsePointer() && this.selected.wasReactivated()) this.startEdit(row, col);
  }

  /** @inheritdoc */
  editDraft(row: number, col: number): string | null {
    return this.editing.draftAt(row, col);
  }

  /** @inheritdoc */
  isDraftInvalid(): boolean {
    return this.editing.isDraftInvalid();
  }

  /** @inheritdoc */
  startEdit(row: number, col: number): void {
    this.editing.open({ row, col }, null);
  }

  /** @inheritdoc */
  updateDraft(text: string): void {
    this.editing.update(text);
  }

  /** @inheritdoc */
  commitEdit(move?: GridMove): void {
    this.editing.commit(move);
  }

  /** @inheritdoc */
  cancelEdit(): void {
    this.editing.cancel();
  }

  /** @inheritdoc */
  leaveEdit(): void {
    this.editing.leave();
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
   * collapse, opening the editor and the shortcuts that act on the
   * selection. Keys pressed in the header, or in a control the app put
   * inside a cell, are not handled here. The editor handles its own
   * keys; the ones that still arrive with an editor open were typed
   * before it took focus.
   */
  protected onKeydown(event: KeyboardEvent): void {
    const active = this.selected.activeCell();
    const target = event.target as HTMLElement;
    if (!active || target.closest('.nga-grid__header') || target.closest(INTERACTIVE_SELECTOR)) return;

    if (this.editing.isOpen()) {
      if (isTypingKey(event)) {
        this.editing.append(event.key);
        event.preventDefault();
      }
      return;
    }

    const handled =
      this.handleTreeKey(event, active) ||
      this.handleCommandKey(event) ||
      this.handleMoveKey(event, active) ||
      this.handleEditKey(event, active);
    if (handled) event.preventDefault();
  }

  /**
   * Gives the grid an active cell the first time it receives focus, and
   * notes when focus leaves the header for the cells.
   */
  protected onFocusIn(event: FocusEvent): void {
    this.selected.ensureActive();
    if (!(event.target as HTMLElement).closest('.nga-grid__header')) this.headerKeys.blur();
  }

  /** Mirrors the scroll position into signals, which drives virtualization. */
  protected onScroll(): void {
    const element = this.viewport().nativeElement;
    this.scrollTop.set(element.scrollTop);
    this.scrollLeft.set(element.scrollLeft);
  }

  /**
   * In the tree column, Right opens a collapsed branch and Left closes an
   * open one, before either key moves the active cell. Left on a row
   * with nothing to collapse goes to its parent. Shift, Ctrl, Alt or Meta
   * leaves the key for selection and movement.
   *
   * @returns Whether the key was used.
   */
  private handleTreeKey(event: KeyboardEvent, active: GridCellPosition): boolean {
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return false;
    const key = event.key;
    const entry = this.rowList().get(active.row);
    const column = this.columnModel().columns[active.col];
    if (entry.kind !== 'row' || !column.tree) return false;
    if (key === 'ArrowLeft' && !entry.expanded) return this.activateParent(entry.row, active.col);
    if (!entry.hasChildren) return false;

    const opens = key === 'ArrowRight' && !entry.expanded;
    const closes = key === 'ArrowLeft' && entry.expanded;
    if (opens || closes) this.toggleRow(entry.row);
    return opens || closes;
  }

  /**
   * Moves the active cell for a navigation key; with Shift, extends the
   * selection instead. ↑ on the first row moves focus to the header.
   *
   * @returns Whether the key was a navigation key.
   */
  private handleMoveKey(event: KeyboardEvent, active: GridCellPosition): boolean {
    const move = moveForKey(event.key, event.ctrlKey || event.metaKey);
    if (!move) return false;
    if (move === 'up' && active.row === 0 && !event.shiftKey) {
      this.headerKeys.focus(active.col);
      return true;
    }
    const from = event.shiftKey ? (this.selected.rangeEnd() ?? active) : active;
    const next = movePosition(from, move, this.bounds());
    if (next && event.shiftKey) {
      this.selected.extendTo(next);
      this.focus.scrollIntoView(next);
    } else if (next) this.activate(next.row, next.col);
    return true;
  }

  /**
   * Shortcuts that act on the selection: Escape collapses it to the
   * active cell, Shift+Space selects its row, Ctrl+Space selects its
   * column, Ctrl+A selects everything, Ctrl+D fills down, Ctrl+Enter
   * gives the whole selection the active cell's value, Ctrl+Z undoes and
   * Ctrl+Y or Ctrl+Shift+Z redoes. On a Mac ⌘ stands in for Ctrl: ⌘A,
   * ⌘D, ⌘Return, ⌘Z, ⌘Y or ⇧⌘Z. The column shortcut stays Ctrl+Space,
   * because ⌘Space belongs to the system. Alt+↑ and Alt+↓ (⌥↑ and ⌥↓ on
   * a Mac) move the active row when rows can be reordered.
   *
   * @returns Whether the key was used.
   */
  private handleCommandKey(event: KeyboardEvent): boolean {
    if (event.key === 'Escape' && this.selected.hasRange()) {
      this.selected.collapse();
      return true;
    }
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      return this.reorder.moveByKey(event.key === 'ArrowUp' ? -1 : 1);
    }
    // Before the Ctrl/⌘ guard: Shift+Space has neither, and ⌘Space must stay with the OS.
    if (event.key === ' ' && !event.altKey) {
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        this.selected.selectActiveRow();
        return true;
      }
      if (event.ctrlKey && !event.metaKey && !event.shiftKey) {
        this.selected.selectActiveColumn();
        return true;
      }
    }
    if (!event.ctrlKey && !event.metaKey) return false;

    const key = event.key.toLowerCase();
    if (key === 'enter') this.batch.fillFromActive();
    else if (key === 'a') this.selected.selectAll();
    else if (key === 'd') this.batch.fillDown();
    else if (key === 'y' || (key === 'z' && event.shiftKey)) this.batch.redo();
    else if (key === 'z') this.batch.undo();
    else return false;
    return true;
  }

  /**
   * Opens the editor (Enter, F2, or simply typing) or clears the
   * selection (Delete, Backspace).
   *
   * @returns Whether the key was used.
   */
  private handleEditKey(event: KeyboardEvent, active: GridCellPosition): boolean {
    if (event.key === 'Enter' || event.key === 'F2') return this.editing.open(active, null);
    if (isTypingKey(event)) return this.editing.open(active, event.key);
    if (event.key === 'Delete' || event.key === 'Backspace') return this.batch.clear();
    return false;
  }

  /**
   * Moves the active cell to the parent of a row.
   *
   * @returns Whether the row has a parent on show.
   */
  private activateParent(row: GridRow<T>, col: number): boolean {
    const index = row.parentId === undefined || row.parentId === null ? -1 : this.rowList().indexOf(row.parentId);
    if (index < 0) return false;
    this.activate(index, col);
    return true;
  }

  /** The row and column at a display position, or null for a row that is not loaded. */
  private cellAt(position: GridCellPosition): GridCellRef<T> | null {
    const entry = this.rowList().get(position.row);
    const column = this.columnModel().columns[position.col];
    return entry?.kind === 'row' && column ? { row: entry.row, column } : null;
  }

  /** Whether a cell accepts edits. */
  private canEdit(cell: GridCellRef<T>): boolean {
    return isCellEditable(cell.column, this.cellState()?.(cell.row, cell.column));
  }

  /** Moves the active cell by one step. */
  private moveActiveCell(move: GridMove): void {
    const active = this.selected.activeCell();
    const next = active && movePosition(active, move, this.bounds());
    if (next) this.activate(next.row, next.col);
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
