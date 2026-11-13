import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsGridComponent,
  type GridFilters,
  type GridRowId,
  type GridSort,
} from "../../../components/grid";
import {
  NgAtomsButtonDirective,
} from "../../../components/button";
import {
  type LedgerLine,
  buildLedgerColumns,
  buildLedgerRows,
  buildScaleColumns,
  buildScaleRows,
  buildStatementColumns,
  buildStatementRows,
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
  readonly statementRows = buildStatementRows();
  readonly statementColumns = buildStatementColumns();
  readonly statementExpanded = signal<ReadonlySet<GridRowId>>(new Set(["revenue", "product", "opex"]));

  readonly scaleRows = buildScaleRows(100, 999);
  readonly scaleColumns = buildScaleColumns(500);
  readonly scaleExpanded = signal<ReadonlySet<GridRowId>>(new Set(this.scaleRows.map((row) => row.id)));

  readonly ledgerRows = buildLedgerRows();
  readonly ledgerColumns = buildLedgerColumns(false);
  readonly ledgerInteractiveColumns = buildLedgerColumns(true);
  readonly ledgerFilters = signal<GridFilters<LedgerLine>>({});
  readonly ledgerSort = signal<GridSort[]>([{ columnId: "variance", direction: "desc" }]);

  readonly density = signal<"compact" | "comfortable">("compact");

  get activeFilterCount(): number {
    return Object.keys(this.ledgerFilters()).length;
  }

  readonly heroCode = "<nga-grid\n  [rows]=\"rows\"\n  [columns]=\"columns\"\n  [(expanded)]=\"expanded\"\n  locale=\"en-US\"\n  label=\"Income statement 2026\"\n/>";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsGridComponent, GridColumnNode, GridRow, GridRowId } from './ui/grid';\n\ninterface Line { name: string; jan: number; feb: number }\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsGridComponent],\n  template: `<nga-grid [rows]=\"rows\" [columns]=\"columns\" [(expanded)]=\"expanded\" />`,\n})\nexport class MyComponent {\n  readonly expanded = signal<ReadonlySet<GridRowId>>(new Set(['revenue']));\n\n  // Rows are flat; the hierarchy comes from parentId.\n  // The total on \"revenue\" is supplied by the app, not computed by the grid.\n  readonly rows: GridRow<Line>[] = [\n    { id: 'revenue', data: { name: 'Revenue', jan: 300, feb: 340 } },\n    { id: 'product', parentId: 'revenue', data: { name: 'Product', jan: 200, feb: 220 } },\n    { id: 'services', parentId: 'revenue', data: { name: 'Services', jan: 100, feb: 120 } },\n  ];\n\n  readonly columns: GridColumnNode<Line>[] = [\n    { id: 'name', header: 'Account', pinned: 'left', tree: true, width: 220 },\n    {\n      id: 'q1', header: 'Q1', children: [\n        { id: 'jan', header: 'Jan', type: 'number', format: { decimals: 0 } },\n        { id: 'feb', header: 'Feb', type: 'number', format: { decimals: 0 } },\n      ],\n    },\n  ];\n}";

  readonly codeSimple = "const columns: GridColumnNode<LedgerLine>[] = [\n  { id: 'entity', header: 'Entity', width: 120 },\n  { id: 'costCenter', header: 'Cost center', width: 140 },\n  { id: 'account', header: 'Account', width: 140 },\n  { id: 'owner', header: 'Owner', width: 120 },\n  { id: 'actual', header: 'Actual', type: 'number', format: amount },\n  { id: 'budget', header: 'Budget', type: 'number', format: amount },\n  { id: 'variance', header: 'Var', type: 'number', format: amount, variance: true },\n];\n\n// <nga-grid [rows]=\"rows\" [columns]=\"columns\" />";

  readonly codeFilters = "const columns: GridColumnNode<LedgerLine>[] = [\n  { id: 'entity', header: 'Entity', sortable: true, filter: 'set' },\n  { id: 'account', header: 'Account', sortable: true, filter: 'text' },\n  { id: 'actual', header: 'Actual', type: 'number', sortable: true, filter: 'number' },\n];\n\nreadonly filters = signal<GridFilters<LedgerLine>>({});\nreadonly sort = signal<GridSort[]>([{ columnId: 'actual', direction: 'desc' }]);\n\n// <nga-grid [rows]=\"rows\" [columns]=\"columns\" [(filters)]=\"filters\" [(sort)]=\"sort\" />\n\n// Restore a saved view:\nthis.filters.set({\n  entity: { type: 'set', values: ['Portugal', 'Brazil'] },\n  actual: { type: 'number', operator: 'gt', value: 20000 },\n});";

  readonly codeExternal = "// <nga-grid\n//   [rows]=\"rows()\"\n//   [columns]=\"columns\"\n//   filterMode=\"external\"\n//   sortMode=\"external\"\n//   [(filters)]=\"filters\"\n//   [(sort)]=\"sort\"\n// />\n\nreadonly rows = signal<GridRow<Line>[]>([]);\nreadonly filters = signal<GridFilters<Line>>({});\nreadonly sort = signal<GridSort[]>([]);\n\nconstructor() {\n  effect(() => {\n    this.api.query(this.filters(), this.sort()).then(rows => this.rows.set(rows));\n  });\n}";

  readonly codeRows = "const rows: GridRow<Line>[] = [\n  { id: 'opex', data: opexTotals, favorable: 'lower' },\n  { id: 'travel', parentId: 'opex', data: travel, favorable: 'lower' },\n  { id: 'operating-income', data: operatingIncome, kind: 'total' },\n];";

  readonly codeColumns = "const columns: GridColumnNode<Line>[] = [\n  { id: 'name', header: 'Account', pinned: 'left', tree: true },\n  {\n    id: 'actual', header: 'Actual 2026', children: [\n      { id: 'q1', header: 'Q1', children: [\n        { id: 'm1', header: 'Jan', type: 'number' },\n        { id: 'm2', header: 'Feb', type: 'number' },\n        { id: 'm3', header: 'Mar', type: 'number' },\n      ] },\n    ],\n  },\n  { id: 'fy', header: 'FY 2026', type: 'number', pinned: 'right' },\n];";

  readonly codeFormatting = "// Accounting style: 1,234 · (1,234) · –\nconst amount: GridNumberFormat = { decimals: 0, negative: 'parentheses', zero: '–' };\n\n// Thousands, one decimal\nconst thousands: GridNumberFormat = { scale: 1000, decimals: 1 };\n\n// Revenue stored as a credit, shown positive\nconst credit: GridNumberFormat = { reverseSign: true };\n\nconst columns = [\n  { id: 'variance', header: 'Var', type: 'number', format: amount, variance: true },\n];\n\nconst rows = [\n  { id: 'travel', data: travel, favorable: 'lower' },\n  { id: 'margin', data: margin, format: { style: 'percent', decimals: 1 } },\n];";

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
        { name: "rowCount", type: "number | null", defaultVal: "null", description: "Size of the full result when flat data is paged by scroll. Rows not supplied yet render as placeholders." },
        { name: "filters", type: "GridFilters<T> (model)", defaultVal: "{}", description: "Two-way binding for the active filters, by column id." },
        { name: "filterMode", type: "'client' | 'external'", defaultVal: "'client'", description: "Who filters: the grid, or the app." },
        { name: "sort", type: "GridSort[] (model)", defaultVal: "[]", description: "Two-way binding for the sort state. One column at a time." },
        { name: "sortMode", type: "'client' | 'external'", defaultVal: "'client'", description: "Who sorts: the grid, or the app." },
        { name: "density", type: "'compact' | 'comfortable'", defaultVal: "'compact'", description: "Row height preset." },
        { name: "locale", type: "string", defaultVal: "browser locale", description: "Locale used to format numbers." },
        { name: "label", type: "string", defaultVal: "''", description: "Accessible name of the grid." },
      ],
    },
    {
      kind: "Outputs",
      target: "nga-grid",
      props: [
        { name: "rowExpand", type: "GridRowId", defaultVal: "—", description: "A row with hasChildren and no loaded children was expanded. Load them and pass them in." },
        { name: "visibleRangeChange", type: "{ start, end }", defaultVal: "—", description: "The rendered row window changed. Use it to load pages while scrolling." },
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
        { name: "pinned", type: "'left' | 'right'", defaultVal: "—", description: "Keeps the column in view." },
        { name: "tree", type: "boolean", defaultVal: "false", description: "Shows the hierarchy in this column." },
        { name: "format", type: "GridNumberFormat", defaultVal: "—", description: "Number format." },
        { name: "variance", type: "boolean", defaultVal: "false", description: "Colors the value by the row's favorable direction." },
        { name: "sortable", type: "boolean", defaultVal: "false", description: "Clicking the header sorts by this column." },
        { name: "filter", type: "'text' | 'number' | 'set'", defaultVal: "—", description: "Filter offered in the header." },
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
    { icon: "table", title: "Grid semantics", body: "The grid has role=\"treegrid\" (or \"grid\" without hierarchy) with aria-rowcount and aria-colcount for the full data, and aria-rowindex and aria-colindex on rendered cells, so virtualization does not hide the real size." },
    { icon: "tree-structure", title: "Hierarchy", body: "Rows expose aria-level and, when they have children, aria-expanded." },
    { icon: "palette", title: "Not color alone", body: "Variance values keep their sign or parentheses, so favorable and unfavorable never depend on color." },
    { icon: "funnel", title: "Sorting and filters", body: "Sortable headers expose aria-sort. The filter button is labelled per column and states whether a filter is active; its popover is a labelled dialog that takes focus and returns it on close." },
    { icon: "warning", title: "Not yet keyboard-operable", body: "Cells cannot be focused or navigated with the keyboard yet. The expand toggles and the header controls are pointer-only until then." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "simple", label: "Simple headers" },
    { id: "filters", label: "Filters and sorting" },
    { id: "external", label: "Filtering on the server" },
    { id: "rows", label: "Rows and hierarchy" },
    { id: "columns", label: "Column groups and pinning" },
    { id: "formatting", label: "Number formatting" },
    { id: "density", label: "Density" },
    { id: "scale", label: "Scale" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
