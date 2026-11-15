import { Component, computed, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsGridComponent,
  type GridCellChange,
  type GridCellRejection,
  type GridColumn,
  type GridFilters,
  type GridRow,
  type GridRowId,
  type GridSelection,
  type GridSort,
} from "../../../components/grid";
import {
  NgAtomsButtonDirective,
} from "../../../components/button";
import {
  NgAtomsPaginationComponent,
} from "../../../components/pagination";
import {
  ORDER_COUNT,
  type OrderLine,
  type PlanLine,
  type RegionLine,
  type StockLine,
  applyPlanChanges,
  buildOrderColumns,
  buildPlanColumns,
  buildPlanLeaves,
  buildRegionColumns,
  buildRegionRows,
  buildSalesColumns,
  buildSalesRows,
  buildScaleColumns,
  buildScaleRows,
  buildStockColumns,
  buildStockRows,
  fetchOrders,
  fetchRegionStores,
  isPlanMonthLocked,
  withPlanTotals,
} from "./grid-demo-data";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-grid-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsGridComponent,
    NgAtomsButtonDirective,
    NgAtomsPaginationComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./grid-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./grid-page.component.css",
})
export class GridPageComponent {
  readonly salesRows = buildSalesRows();
  readonly salesColumns = buildSalesColumns();
  readonly salesExpanded = signal<ReadonlySet<GridRowId>>(new Set(["electronics", "audio", "home"]));

  readonly stockRows = buildStockRows();
  readonly stockColumns = buildStockColumns(false);
  readonly stockInteractiveColumns = buildStockColumns(true);
  readonly stockFilters = signal<GridFilters<StockLine>>({});
  readonly stockSort = signal<GridSort[]>([{ columnId: "difference", direction: "asc" }]);

  readonly planColumns = buildPlanColumns();
  readonly planExpanded = signal<ReadonlySet<GridRowId>>(new Set(["audio", "computing", "kitchen"]));
  private readonly planLeaves = signal(buildPlanLeaves());
  private readonly planDirty = signal<ReadonlySet<string>>(new Set());
  readonly planRows = computed(() => withPlanTotals(this.planLeaves()));
  readonly lastChange = signal("none yet");
  readonly planSelection = signal<GridSelection | null>(null);
  readonly planRejected = signal("");
  readonly planSummary = computed(() => {
    const selection = this.planSelection();
    if (!selection) return "nothing selected";
    const rows = new Map(this.planRows().map((row) => [row.id, row]));
    const values = selection.rowIds
      .flatMap((id) => selection.columnIds.map((columnId) => rows.get(id)?.data[columnId]))
      .filter((value): value is number => typeof value === "number");
    const sum = values.reduce((total, value) => total + value, 0);
    const cells = selection.rowIds.length * selection.columnIds.length;
    return `${cells} ${cells === 1 ? "cell" : "cells"} selected · sum ${sum.toLocaleString("en-US")}`;
  });

  readonly scaleRows = buildScaleRows(100, 999);
  readonly scaleColumns = buildScaleColumns(500);
  readonly scaleExpanded = signal<ReadonlySet<GridRowId>>(new Set(this.scaleRows.map((row) => row.id)));

  readonly density = signal<"compact" | "comfortable">("compact");

  readonly columnWidths = signal<Readonly<Record<string, number>>>({});
  readonly exportSample = signal("");

  readonly orderCount = ORDER_COUNT;
  readonly orderColumns = buildOrderColumns();
  readonly orderRows = signal<GridRow<OrderLine>[]>([]);
  private readonly orderPages = new Set<number>();
  private readonly orderPageSize = 100;

  readonly page = signal(1);
  readonly pageSize = 10;
  readonly pageRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.stockRows.slice(start, start + this.pageSize);
  });

  readonly regionColumns = buildRegionColumns();
  readonly regionRows = signal<GridRow<RegionLine>[]>(buildRegionRows());
  readonly regionExpanded = signal<ReadonlySet<GridRowId>>(new Set());

  get resizedColumns(): string {
    const entries = Object.entries(this.columnWidths());
    return entries.length ? entries.map(([id, width]) => `${id}: ${width}px`).join(" · ") : "drag a column edge, or double-click it";
  }

  showExport(text: string): void {
    const lines = text.split("\r\n");
    this.exportSample.set(`${lines.slice(0, 4).join("\n")}\n… ${lines.length} lines`);
  }

  onOrdersRange(range: { start: number; end: number }): void {
    const first = Math.floor(range.start / this.orderPageSize);
    const last = Math.floor(Math.max(range.start, range.end - 1) / this.orderPageSize);
    for (let page = first; page <= last; page++) {
      if (this.orderPages.has(page)) continue;
      this.orderPages.add(page);
      const start = page * this.orderPageSize;
      void fetchOrders(start, start + this.orderPageSize).then((rows) =>
        this.orderRows.update((loaded) => [...loaded, ...rows]),
      );
    }
  }

  onRegionExpand(regionId: GridRowId): void {
    void fetchRegionStores(regionId).then((stores) => this.regionRows.update((rows) => [...rows, ...stores]));
  }

  get activeFilterCount(): number {
    return Object.keys(this.stockFilters()).length;
  }

  readonly planCellState = (row: GridRow<PlanLine>, column: GridColumn<PlanLine>) => {
    if (row.parentId === undefined) return { calculated: true };
    if (isPlanMonthLocked(column.id)) return { locked: true };
    const value = row.data[column.id];
    if (typeof value === "number" && value < 0) return { invalid: "Units cannot be negative" };
    return this.planDirty().has(`${row.id}:${column.id}`) ? { dirty: true } : null;
  };

  onPlanChange(changes: GridCellChange[]): void {
    this.planLeaves.update((leaves) => applyPlanChanges(leaves, changes));
    this.planDirty.update((dirty) => new Set([...dirty, ...changes.map((c) => `${c.rowId}:${c.columnId}`)]));
    const last = changes[changes.length - 1];
    const more = changes.length > 1 ? ` (+${changes.length - 1} more)` : "";
    this.lastChange.set(`${last.rowId} · ${last.columnId}: ${last.previous ?? "empty"} → ${last.next ?? "empty"}${more}`);
    this.planRejected.set("");
  }

  onPlanRejected(rejected: GridCellRejection[]): void {
    this.planRejected.set(` · ${rejected.length} pasted ${rejected.length === 1 ? "value" : "values"} skipped`);
  }

  readonly heroCode = "<nga-grid\n  [rows]=\"rows\"\n  [columns]=\"columns\"\n  [(expanded)]=\"expanded\"\n  locale=\"en-US\"\n  label=\"Units sold in 2026\"\n/>";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsGridComponent, GridColumnNode, GridRow, GridRowId } from './ui/grid';\n\ninterface Line { name: string; jan: number; feb: number }\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsGridComponent],\n  template: `<nga-grid [rows]=\"rows\" [columns]=\"columns\" [(expanded)]=\"expanded\" />`,\n})\nexport class MyComponent {\n  readonly expanded = signal<ReadonlySet<GridRowId>>(new Set(['audio']));\n\n  // Rows are flat; the hierarchy comes from parentId.\n  // The total on \"audio\" is supplied by the app, not computed by the grid.\n  readonly rows: GridRow<Line>[] = [\n    { id: 'audio', data: { name: 'Audio', jan: 300, feb: 340 } },\n    { id: 'headphones', parentId: 'audio', data: { name: 'Headphones', jan: 200, feb: 220 } },\n    { id: 'speakers', parentId: 'audio', data: { name: 'Speakers', jan: 100, feb: 120 } },\n  ];\n\n  readonly columns: GridColumnNode<Line>[] = [\n    { id: 'name', header: 'Product', pinned: 'left', tree: true, width: 220 },\n    {\n      id: 'q1', header: 'Q1', children: [\n        { id: 'jan', header: 'Jan', type: 'number', format: { decimals: 0 } },\n        { id: 'feb', header: 'Feb', type: 'number', format: { decimals: 0 } },\n      ],\n    },\n  ];\n}";

  readonly codeSimple = "const columns: GridColumnNode<StockLine>[] = [\n  { id: 'warehouse', header: 'Warehouse', width: 120 },\n  { id: 'category', header: 'Category', width: 120 },\n  { id: 'product', header: 'Product', width: 170 },\n  { id: 'supplier', header: 'Supplier', width: 120 },\n  { id: 'inStock', header: 'In stock', type: 'number', format: units },\n  { id: 'reorderLevel', header: 'Reorder at', type: 'number', format: units },\n  { id: 'difference', header: 'Diff', type: 'number', format: units, variance: true },\n];\n\n// <nga-grid [rows]=\"rows\" [columns]=\"columns\" />";

  readonly codeFilters = "const columns: GridColumnNode<StockLine>[] = [\n  { id: 'warehouse', header: 'Warehouse', sortable: true, filter: 'set' },\n  { id: 'product', header: 'Product', sortable: true, filter: 'text' },\n  { id: 'inStock', header: 'In stock', type: 'number', sortable: true, filter: 'number' },\n];\n\nreadonly filters = signal<GridFilters<StockLine>>({});\nreadonly sort = signal<GridSort[]>([{ columnId: 'inStock', direction: 'desc' }]);\n\n// <nga-grid [rows]=\"rows\" [columns]=\"columns\" [(filters)]=\"filters\" [(sort)]=\"sort\" />\n\n// Restore a saved view:\nthis.filters.set({\n  warehouse: { type: 'set', values: ['Lisbon', 'Toronto'] },\n  inStock: { type: 'number', operator: 'lt', value: 100 },\n});";

  readonly codeExternal = "// <nga-grid\n//   [rows]=\"rows()\"\n//   [columns]=\"columns\"\n//   filterMode=\"external\"\n//   sortMode=\"external\"\n//   [(filters)]=\"filters\"\n//   [(sort)]=\"sort\"\n// />\n\nreadonly rows = signal<GridRow<Line>[]>([]);\nreadonly filters = signal<GridFilters<Line>>({});\nreadonly sort = signal<GridSort[]>([]);\n\nconstructor() {\n  effect(() => {\n    this.api.query(this.filters(), this.sort()).then(rows => this.rows.set(rows));\n  });\n}";

  readonly codeEditing = "// <nga-grid\n//   [rows]=\"rows()\"\n//   [columns]=\"columns\"\n//   [cellState]=\"cellState\"\n//   (cellsChange)=\"onCellsChange($event)\"\n// />\n\nreadonly columns: GridColumnNode<Line>[] = [\n  { id: 'name', header: 'Product', pinned: 'left', tree: true },\n  { id: 'm1', header: 'Jan', type: 'number', editable: true },\n  { id: 'm2', header: 'Feb', type: 'number', editable: true },\n];\n\nprivate readonly leaves = signal<GridRow<Line>[]>(loadLeaves());\nprivate readonly dirty = signal<ReadonlySet<string>>(new Set());\n\n// Totals belong to the app: they are derived from the leaves on every change.\nreadonly rows = computed(() => withTotals(this.leaves()));\n\nonCellsChange(changes: GridCellChange[]): void {\n  this.leaves.update(leaves => applyChanges(leaves, changes));\n  this.dirty.update(dirty => new Set([...dirty, ...changes.map(c => `${c.rowId}:${c.columnId}`)]));\n}\n\nreadonly cellState = (row: GridRow<Line>, column: GridColumn<Line>) => {\n  if (row.parentId === undefined) return { calculated: true };\n  if (column.id === 'm1') return { locked: true };\n  if (Number(row.data[column.id]) < 0) return { invalid: 'Units cannot be negative' };\n  return this.dirty().has(`${row.id}:${column.id}`) ? { dirty: true } : null;\n};";

  readonly codeSelection = "// <nga-grid\n//   [rows]=\"rows()\"\n//   [columns]=\"columns\"\n//   (cellsChange)=\"onCellsChange($event)\"\n//   (cellsRejected)=\"onCellsRejected($event)\"\n//   (selectionChange)=\"selection.set($event)\"\n// />\n\nreadonly selection = signal<GridSelection | null>(null);\n\n// Positions move with sorting and filtering; the ids do not.\nreadonly sum = computed(() => {\n  const selection = this.selection();\n  if (!selection) return 0;\n  const rows = new Map(this.rows().map(row => [row.id, row]));\n  return selection.rowIds\n    .flatMap(id => selection.columnIds.map(columnId => rows.get(id)?.data[columnId]))\n    .filter(value => typeof value === 'number')\n    .reduce((total, value) => total + value, 0);\n});\n\nonCellsRejected(rejected: GridCellRejection[]): void {\n  // { rowId, columnId, text, reason: 'readonly' | 'invalid' }\n  this.toast.show(`${rejected.length} values were skipped`);\n}\n\n// After loading different data, drop the undo history:\n// this.grid().clearHistory();";

  readonly codeRows = "const rows: GridRow<Line>[] = [\n  { id: 'returns', data: returnsTotals, favorable: 'lower' },\n  { id: 'damaged', parentId: 'returns', data: damaged, favorable: 'lower' },\n  { id: 'net', data: netUnits, kind: 'total' },\n];";

  readonly codeColumns = "const columns: GridColumnNode<Line>[] = [\n  { id: 'name', header: 'Product', pinned: 'left', tree: true },\n  {\n    id: 'units', header: 'Units 2026', children: [\n      { id: 'q1', header: 'Q1', children: [\n        { id: 'm1', header: 'Jan', type: 'number' },\n        { id: 'm2', header: 'Feb', type: 'number' },\n        { id: 'm3', header: 'Mar', type: 'number' },\n      ] },\n    ],\n  },\n  { id: 'year', header: 'Year', type: 'number', pinned: 'right' },\n];";

  readonly codeFormatting = "// 1,234 · (1,234) · –\nconst units: GridNumberFormat = { decimals: 0, negative: 'parentheses', zero: '–' };\n\n// Thousands, one decimal\nconst thousands: GridNumberFormat = { scale: 1000, decimals: 1 };\n\n// A value stored negative, shown positive\nconst reversed: GridNumberFormat = { reverseSign: true };\n\nconst columns = [\n  { id: 'difference', header: 'Diff', type: 'number', format: units, variance: true },\n];\n\nconst rows = [\n  { id: 'returns', data: returns, favorable: 'lower' },\n  { id: 'return-rate', data: returnRate, format: { style: 'percent', decimals: 1 } },\n];";

  readonly codeColumnWidth = "readonly columnWidths = signal<Record<string, number>>(loadSavedWidths());\n\n// <nga-grid [rows]=\"rows\" [columns]=\"columns\" [(columnWidths)]=\"columnWidths\" />\n\nconst columns: GridColumnNode<StockLine>[] = [\n  { id: 'product', header: 'Product', width: 170, minWidth: 120 },\n  { id: 'supplier', header: 'Supplier', resizable: false },\n  { id: 'internalCode', header: 'Code', hidden: true },\n];";

  readonly codePagingScroll = "// <nga-grid\n//   [rows]=\"rows()\"\n//   [rowCount]=\"total\"\n//   [columns]=\"columns\"\n//   (visibleRangeChange)=\"onRange($event)\"\n// />\n\nreadonly rows = signal<GridRow<Order>[]>([]);\nprivate readonly requested = new Set<number>();\n\nonRange(range: { start: number; end: number }): void {\n  const first = Math.floor(range.start / PAGE);\n  const last = Math.floor((range.end - 1) / PAGE);\n  for (let page = first; page <= last; page++) {\n    if (this.requested.has(page)) continue;\n    this.requested.add(page);\n    // Each row comes back with its index in the full result.\n    this.api.orders(page * PAGE, PAGE).then(rows => this.rows.update(loaded => [...loaded, ...rows]));\n  }\n}";

  readonly codePagingPages = "readonly page = signal(1);\nreadonly pageSize = 10;\nreadonly pageRows = computed(() => {\n  const start = (this.page() - 1) * this.pageSize;\n  return this.allRows.slice(start, start + this.pageSize);\n});\n\n// <nga-grid [rows]=\"pageRows()\" [columns]=\"columns\" />\n// <nga-pagination [(page)]=\"page\" [total]=\"allRows.length\" [pageSize]=\"pageSize\" />";

  readonly codeLazyChildren = "// <nga-grid\n//   [rows]=\"rows()\"\n//   [columns]=\"columns\"\n//   [(expanded)]=\"expanded\"\n//   (rowExpand)=\"onRowExpand($event)\"\n// />\n\nreadonly rows = signal<GridRow<Region>[]>([\n  { id: 'iberia', hasChildren: true, data: { name: 'Iberia', units: 8420 } },\n]);\n\nonRowExpand(regionId: GridRowId): void {\n  this.api.stores(regionId).then(stores => this.rows.update(rows => [...rows, ...stores]));\n}";

  readonly codeExport = "// <nga-grid #grid [rows]=\"rows\" [columns]=\"columns\" />\n// <button (click)=\"download(grid.exportText())\">Download CSV</button>\n\ndownload(csv: string): void {\n  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));\n  const link = Object.assign(document.createElement('a'), { href: url, download: 'units.csv' });\n  link.click();\n  URL.revokeObjectURL(url);\n}\n\n// Semicolon-separated, written as shown on screen:\ngrid.exportText({ delimiter: ';', values: 'formatted' });";

  readonly codeDensity = "<nga-grid [rows]=\"rows\" [columns]=\"columns\" density=\"comfortable\" />";

  readonly codeScale = "<nga-grid [rows]=\"rows\" [columns]=\"columns\" [(expanded)]=\"expanded\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-grid",
      props: [
        { name: "rows", type: "GridRow<T>[]", defaultVal: "[]", description: "Flat rows. Hierarchy comes from parentId." },
        { name: "columns", type: "GridColumnNode<T>[]", defaultVal: "[]", description: "Column groups and leaf columns." },
        { name: "expanded", type: "ReadonlySet<GridRowId> (model)", defaultVal: "empty", description: "Two-way binding for the expanded rows." },
        { name: "filters", type: "GridFilters<T> (model)", defaultVal: "{}", description: "Two-way binding for the active filters, by column id." },
        { name: "filterMode", type: "'client' | 'external'", defaultVal: "'client'", description: "Who filters: the grid, or the app." },
        { name: "sort", type: "GridSort[] (model)", defaultVal: "[]", description: "Two-way binding for the sort state. One column at a time." },
        { name: "sortMode", type: "'client' | 'external'", defaultVal: "'client'", description: "Who sorts: the grid, or the app." },
        { name: "cellState", type: "(row, column) => GridCellState | null", defaultVal: "null", description: "Resolves per-cell state. Called for every rendered cell, so keep it cheap." },
        { name: "rowCount", type: "number | null", defaultVal: "null", description: "Size of the full result when flat data is paged by scroll. Rows not supplied yet render as placeholders." },
        { name: "columnWidths", type: "Record<string, number> (model)", defaultVal: "{}", description: "Two-way binding for the widths the user set by dragging, by column id." },
        { name: "density", type: "'compact' | 'comfortable'", defaultVal: "'compact'", description: "Row height preset." },
        { name: "locale", type: "string", defaultVal: "browser locale", description: "Locale used to format and parse numbers." },
        { name: "label", type: "string", defaultVal: "''", description: "Accessible name of the grid." },
      ],
    },
    {
      kind: "Outputs",
      target: "nga-grid",
      props: [
        { name: "cellsChange", type: "GridCellChange[]", defaultVal: "—", description: "The user edited cells. Each change has rowId, columnId, previous and next. Apply it and pass new rows in." },
        { name: "cellsRejected", type: "GridCellRejection[]", defaultVal: "—", description: "Pasted values that were skipped: the cell does not accept edits, or the text is not a value for the column." },
        { name: "selectionChange", type: "GridSelection | null", defaultVal: "—", description: "The selected block changed: its range in display positions, plus the row ids and column ids it covers." },
        { name: "rowExpand", type: "GridRowId", defaultVal: "—", description: "A row with hasChildren and no loaded children was expanded. Load them and pass them in." },
        { name: "visibleRangeChange", type: "{ start, end }", defaultVal: "—", description: "The rendered row window changed. Use it to load pages while scrolling." },
      ],
    },
    {
      kind: "Methods",
      target: "nga-grid",
      props: [
        { name: "exportText(options?)", type: "string", defaultVal: "—", description: "The rows on show as delimited text. Options: delimiter (','), headers (true), values ('raw' | 'formatted')." },
        { name: "clearHistory()", type: "void", defaultVal: "—", description: "Forgets the undo history. Call it after loading different data." },
      ],
    },
    {
      kind: "Fields",
      target: "GridRow",
      props: [
        { name: "id", type: "string | number", defaultVal: "required", description: "Stable identity of the row." },
        { name: "data", type: "T", defaultVal: "required", description: "Your record. Cells read from it." },
        { name: "parentId", type: "string | number", defaultVal: "—", description: "Id of the parent row." },
        { name: "kind", type: "'data' | 'subtotal' | 'total'", defaultVal: "'data'", description: "Visual treatment only." },
        { name: "favorable", type: "'higher' | 'lower'", defaultVal: "'higher'", description: "Which direction of a variance is good news." },
        { name: "format", type: "GridNumberFormat", defaultVal: "—", description: "Overrides the column format for the whole row." },
        { name: "hasChildren", type: "boolean", defaultVal: "false", description: "The row has children that are not loaded yet." },
        { name: "index", type: "number", defaultVal: "—", description: "Position in the full result, for rows paged by scroll." },
      ],
    },
    {
      kind: "Fields",
      target: "GridColumn",
      props: [
        { name: "id", type: "string", defaultVal: "required", description: "Unique column id. Also the key read from data when field is not set." },
        { name: "header", type: "string", defaultVal: "required", description: "Header text." },
        { name: "field", type: "string", defaultVal: "id", description: "Key of data to read." },
        { name: "valueGetter", type: "(row) => value", defaultVal: "—", description: "Computes the value; wins over field." },
        { name: "type", type: "'text' | 'number'", defaultVal: "'text'", description: "Number columns are right-aligned and formatted." },
        { name: "width", type: "number", defaultVal: "120", description: "Width in px." },
        { name: "minWidth", type: "number", defaultVal: "48", description: "Smallest width a resize can reach, in px." },
        { name: "resizable", type: "boolean", defaultVal: "true", description: "Whether the user can drag the edge of the header." },
        { name: "hidden", type: "boolean", defaultVal: "false", description: "Leaves the column out without removing it from the column tree." },
        { name: "pinned", type: "'left' | 'right'", defaultVal: "—", description: "Keeps the column in view." },
        { name: "tree", type: "boolean", defaultVal: "false", description: "Shows the hierarchy in this column." },
        { name: "format", type: "GridNumberFormat", defaultVal: "—", description: "Number format." },
        { name: "variance", type: "boolean", defaultVal: "false", description: "Colors the value by the row's favorable direction." },
        { name: "editable", type: "boolean", defaultVal: "false", description: "Cells accept input, unless their state says otherwise." },
        { name: "sortable", type: "boolean", defaultVal: "false", description: "Clicking the header sorts by this column." },
        { name: "filter", type: "'text' | 'number' | 'set'", defaultVal: "—", description: "Filter offered in the header." },
      ],
    },
    {
      kind: "Fields",
      target: "GridCellState",
      props: [
        { name: "readonly", type: "boolean", defaultVal: "false", description: "Not editable." },
        { name: "locked", type: "boolean", defaultVal: "false", description: "Closed for input; shown muted." },
        { name: "calculated", type: "boolean", defaultVal: "false", description: "Produced by the app's calculations; not editable." },
        { name: "dirty", type: "boolean", defaultVal: "false", description: "Changed and not saved; marked in the corner." },
        { name: "invalid", type: "string | boolean", defaultVal: "false", description: "Marks the cell as invalid. A string is shown as its message." },
        { name: "pending", type: "boolean", defaultVal: "false", description: "A save is in flight; not editable meanwhile." },
        { name: "note", type: "boolean", defaultVal: "false", description: "The cell has a note; marked in the corner." },
      ],
    },
    {
      kind: "Fields",
      target: "GridNumberFormat",
      props: [
        { name: "style", type: "'number' | 'percent'", defaultVal: "'number'", description: "Percent expects a fraction: 0.12 shows 12%." },
        { name: "decimals", type: "number", defaultVal: "2 (1 for percent)", description: "Fraction digits." },
        { name: "scale", type: "number", defaultVal: "—", description: "Divides before display: 1000 for thousands." },
        { name: "negative", type: "'minus' | 'parentheses'", defaultVal: "'minus'", description: "How negatives are shown." },
        { name: "zero", type: "string", defaultVal: "—", description: "Text shown for zero, and for values that round to zero." },
        { name: "reverseSign", type: "boolean", defaultVal: "false", description: "Flips the sign for display only." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard navigation", body: "Tab enters the grid on its active cell. Arrow keys move one cell; Home and End travel the row, and with Ctrl the whole grid; Page Up and Page Down move a screen. The active cell is scrolled into view." },
    { icon: "tree-structure", title: "Hierarchy", body: "In the tree column, Right expands a row and Left collapses it. Rows expose aria-level and aria-expanded." },
    { icon: "pencil-simple", title: "Editing", body: "Enter, F2 or typing opens the editor; Enter and Tab commit and move, Escape cancels, and focus returns to the cell. Cells that cannot be edited expose aria-readonly, and invalid ones aria-invalid with their message." },
    { icon: "selection", title: "Selection", body: "Shift with any navigation key extends the selection; Ctrl+A selects all and Escape collapses it. Selected cells expose aria-selected. Copy, cut and paste use the standard clipboard shortcuts and need no permission prompt." },
    { icon: "table", title: "Grid semantics", body: "role=\"treegrid\" (or \"grid\" without hierarchy), with aria-rowcount and aria-colcount for the full data and aria-rowindex and aria-colindex on rendered cells, so virtualization does not hide the real size." },
    { icon: "funnel", title: "Sorting and filters", body: "Sortable headers expose aria-sort. The filter popover is a labelled dialog that takes focus and returns it on close. Header controls — sort, filter and the resize handle — are not yet reachable from the keyboard." },
    { icon: "hand-tap", title: "Touch and small screens", body: "On coarse pointers rows grow to the comfortable height and header controls to a 44px target. Pinned columns release on narrow containers so the scrolling area never collapses." },
    { icon: "palette", title: "Not color alone", body: "Variance values keep their sign or parentheses, and cell states have a marker or a text equivalent as well as a color." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "simple", label: "Simple headers" },
    { id: "filters", label: "Filters and sorting" },
    { id: "external", label: "Filtering on the server" },
    { id: "editing", label: "Editing" },
    { id: "selection", label: "Selection, copy and paste" },
    { id: "rows", label: "Rows and hierarchy" },
    { id: "columns", label: "Column groups and pinning" },
    { id: "formatting", label: "Number formatting" },
    { id: "column-width", label: "Column width" },
    { id: "paging-scroll", label: "Paging by scroll" },
    { id: "paging-pages", label: "Paging with pages" },
    { id: "lazy-children", label: "Loading children on demand" },
    { id: "export", label: "Export" },
    { id: "density", label: "Density" },
    { id: "scale", label: "Scale" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
