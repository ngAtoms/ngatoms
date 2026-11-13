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
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  GridCellValue,
  GridColumn,
  GridColumnNode,
  GridColumnPane,
  GridFilter,
  GridFilters,
  GridHeaderCell,
  GridIndexRange,
  GridRow,
  GridRowId,
  GridSort,
  applyFilters,
  buildColumnModel,
  buildRowTree,
  createNumberFormatter,
  createRowComparator,
  distinctValues,
  fixedSizeRange,
  flattenRows,
  getCellValue,
  isEmptyValue,
  nextSort,
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

/** Row density presets. */
export type NgAtomsGridDensity = 'compact' | 'comfortable';

const ROW_HEIGHT: Record<NgAtomsGridDensity, number> = { compact: 28, comfortable: 36 };

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
    '[class.nga-grid--compact]': 'density() === "compact"',
    '[class.nga-grid--comfortable]': 'density() === "comfortable"',
    '[class.nga-grid--scrolled-start]': 'scrollLeft() > 0',
    '[class.nga-grid--scrolled-end]': 'hasContentAfter()',
    '[style.--nga-grid-row-height.px]': 'rowHeight()',
    '[style.--nga-grid-pinned-left.px]': 'columnModel().panes.left.width',
  },
  providers: [{ provide: NGA_GRID, useExisting: NgAtomsGridComponent }],
})
export class NgAtomsGridComponent<T = unknown> implements NgAtomsGridContext<T> {
  private readonly destroyRef = inject(DestroyRef);
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
  readonly density = input<NgAtomsGridDensity>('compact');
  /** BCP 47 locale for number formatting; defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** Accessible name of the grid. */
  readonly label = input<string>('');

  /** A row with unloaded children was expanded; the app should supply them. */
  readonly rowExpand = output<GridRowId>();
  /** The rendered row window changed; the hook for loading pages by scroll. */
  readonly visibleRangeChange = output<GridIndexRange>();

  protected readonly scrollTop = signal(0);
  protected readonly scrollLeft = signal(0);
  private readonly viewportWidth = signal(0);
  private readonly viewportHeight = signal(0);

  protected readonly rowHeight = computed(() => ROW_HEIGHT[this.density()]);
  private readonly formatter = computed(() => createNumberFormatter(this.locale()));

  protected readonly columnModel = computed(() => buildColumnModel(this.columns()));
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

  protected readonly headerHeight = computed(() => this.columnModel().headerDepth * this.rowHeight());
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
    renderHeaderCells(this.columnModel().panes.left, this.rowHeight()),
  );
  protected readonly centerHeader = computed(() =>
    renderHeaderCells(this.columnModel().panes.center, this.rowHeight(), this.centerColumnRange()),
  );
  protected readonly rightHeader = computed(() =>
    renderHeaderCells(this.columnModel().panes.right, this.rowHeight()),
  );

  constructor() {
    effect(() => this.visibleRangeChange.emit(this.rowRange()));
    afterNextRender(() => this.observeViewportSize());
  }

  /** @inheritdoc */
  headerDepth(): number {
    return this.columnModel().headerDepth;
  }

  /** @inheritdoc */
  cell(row: GridRow<T>, column: GridColumn<T>): GridCellView {
    const value = getCellValue(row, column);
    const numeric = column.type === 'number';
    return {
      text: numeric ? this.formatter().format(value, resolveFormat(row, column)) : toText(value),
      numeric,
      tone: column.variance ? varianceTone(value, row) : null,
    };
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

  /** Mirrors the scroll position into signals, which drives virtualization. */
  protected onScroll(): void {
    const element = this.viewport().nativeElement;
    this.scrollTop.set(element.scrollTop);
    this.scrollLeft.set(element.scrollLeft);
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
}
