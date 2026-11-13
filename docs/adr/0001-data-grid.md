# ADR 0001 — Data grid

- **Status:** Accepted
- **Date:** 2026-11-13
- **Deciders:** Lázaro Dutra
- **Scope:** `packages/primitives` (new `grid-core` and `grid` entries), `registry/`, `apps/docs`

## Context

NgAtoms needs a data grid. A plain table component is not enough: the
grids people build real applications on share a set of needs that simple
tables treat as extras, and those are the hard parts.

What a data-heavy application needs from a grid:

| Need | Why it matters |
|---|---|
| **Hierarchical rows** | Much business data is a tree — categories, regions, departments, product lines. Parents summarize their children and must expand and collapse. |
| **Multi-level column headers** | Columns are often a cross of dimensions, such as year → quarter → month, crossed with measures like value and variance. |
| **Two-axis scale** | A report can be tens of thousands of rows by several hundred columns, most of it off screen. |
| **Frozen panes** | Row headers stay pinned left; totals often pin right or bottom. |
| **Number formatting** | Negatives in parentheses, scaling (thousands, millions), zero as a dash, percent, sign reversal, and variance coloring whose meaning depends on the row (higher is good for some rows, bad for others). |
| **Data entry** | Typing numbers into cells: keyboard-first navigation, range selection, copy/paste to and from spreadsheets, fill, undo/redo. |
| **Cell-level state** | A cell can be locked, calculated, dirty, invalid, pending save, or annotated, independently of its row and column. |
| **Column filters and sorting** | Reports are wide and deep; people narrow and order them from the column header without leaving the grid. |
| **Totals and subtotals** | Shown as rows and columns, often visually distinct, sometimes pinned. |

Constraints inherited from the project:

- **Zero runtime dependencies.** Consumers copy the source in; they must
  not have to install anything.
- **Copy-in distribution** through the registry and `ngatoms add`.
- **Angular 22, signals, zoneless-friendly**, standalone, `nga-` /
  `ngAtoms` naming, styles driven by tokens.
- **Accessibility first**, including keyboard operation.

## Decision

### 1. Build it in-house, with no dependency

We write the grid ourselves instead of wrapping an existing library.
See *Alternatives considered* for why.

### 2. Split into a headless core and an Angular renderer

Two registry entries:

- **`grid-core`** — plain TypeScript, no Angular imports. Owns the
  models and all logic: column tree, row tree and its flattening,
  viewport math for virtualization, selection ranges, edit sessions,
  clipboard parsing/serialization, number formatting, undo stack.
  Pure functions and small classes, unit-testable without a DOM.
- **`grid`** — the Angular component (`nga-grid`) and its directives.
  Renders what the core computes, wires DOM events to core commands,
  exposes signals/models. Depends on `grid-core` via
  `registryDependencies`.

This is what makes "more than one component, or several variations"
cheap: variants are thin presets over one engine rather than forks.

| Variant | What it is |
|---|---|
| `nga-grid` | The full grid. Everything below is configuration of it. |
| Flat table preset | No hierarchy, no editing: lists, lookups, audit logs. |
| Tree grid preset | Hierarchical rows, read-only: summary reports. |
| Editable grid preset | Tree + editing + range selection + clipboard: data entry sheets. |

Presets ship as documented configurations and recipes first. They only
become separate components if a real API difference appears.

### 3. Virtualized DOM rendering, in panes

- Rows **and** columns are virtualized. Only cells in the viewport, plus
  an overscan margin, exist in the DOM.
- The grid is laid out as **panes**: header / body / footer crossed with
  pinned-left / center / pinned-right. Each pane virtualizes on its own
  axis and scroll positions are kept in sync.
- Fixed row height per density in v1. Variable row heights are deferred;
  numeric grids are single-line by nature and fixed heights keep the
  viewport math exact.
- Column widths are explicit (px), resizable, with prefix sums for
  O(log n) offset lookup.

Canvas rendering was rejected (see below).

### 4. The application owns the data; the grid owns the view

- Rows are passed flat, each with an `id` and a `parentId` (or
  pre-computed `level`), plus `expanded` state as a model. The core
  flattens the visible tree.
- Columns are passed as a tree of column groups and leaf columns.
- A cell value is read with a `field` or a `valueGetter(row, column)`.
- **The grid never mutates data.** Edits are emitted as a batch of
  changes (`{ rowId, columnId, previous, next }[]`); the app applies
  them and passes new data in. This fits signals and makes validation,
  server round-trips and spreading the app's decision.
- **No business logic in the grid.** Aggregation, roll-up rules, spreading
  and formulas all belong to the app. The loop is always the same: the
  grid emits a change, the app works on the data and hands the treated
  rows back, the grid renders them. Parent totals are whatever the app
  supplies. A later variant may bundle formulas and common calculation
  logic; this version deliberately does not.
- **No hard size limit.** The grid is tuned for 100k rows × 500 columns
  fully in memory. Beyond that the app pages the data, and chooses how:
  - *by scroll* — the grid takes a `rowCount` larger than the rows it
    was given, renders placeholders for the missing ones and emits the
    visible range so the app can fetch that window;
  - *by pages* — the app renders a pager (`nga-pagination`) and swaps
    the rows. Nothing special is needed from the grid.
- **Lazy children.** A row can declare `hasChildren` without carrying
  them. Expanding it emits an event; the app loads and supplies the
  children.

### 5. Numbers stay opaque; formatting is declarative

- The grid does no arithmetic on cell values. Values may be `number` or
  a decimal `string`; the app chooses the representation, which keeps
  precision out of the grid's hands. The docs default to `number` and
  call out decimal strings for amounts that must not lose precision.
- Formatting uses `Intl.NumberFormat` (no dependency) behind a small
  formatting layer: `accounting` negatives, `scale` (1, 1e3, 1e6),
  `zeroDisplay`, `percent`, `reverseSign`, `decimals`.
- Formats resolve per cell: column default → row override → cell
  override, because a row (a ratio, a headcount line) often dictates the
  format more than the column does.
- Variance semantics: a column can be flagged as a variance, and a row
  carries `favorable: 'higher' | 'lower'`; the grid then applies the
  status tokens (`success` / `destructive`) accordingly.

### 6. Spreadsheet-style interaction

- Two modes: **navigation** (arrows move the active cell) and **edit**
  (typing, F2 or double-click starts; Enter/Tab commit and move;
  Escape cancels).
- **Range selection** by Shift+arrows and drag; one range in v1.
- **Clipboard** as TSV, compatible with Excel and Google Sheets. Paste
  parses localized numbers (thousands separators, parentheses, percent).
- **Fill** down/right over a range. Fill copies values; it is not a
  spreading strategy.
- **Undo/redo** replays edit batches as new change events, so the app
  stays the single owner of the data.
- **Editing a parent (total) cell** is allowed when the app marks it
  editable. The grid emits that one change and nothing else; whether and
  how it spreads to children is the app's call.
- Cell state is resolved by a `cellState(row, column)` function:
  `readonly`, `calculated`, `locked`, `dirty`, `invalid`, `pending`,
  `note`. Each has a visual treatment and an accessible description.

### 7. Accessibility

- `role="treegrid"` (or `grid` without hierarchy), with
  `aria-rowcount` / `aria-colcount` and `aria-rowindex` /
  `aria-colindex` on rendered cells so virtualization stays truthful.
- Real DOM focus on the active cell, restored when a cell scrolls back
  into view. Full keyboard map following the WAI-ARIA grid pattern plus
  the spreadsheet conventions above.
- Color is never the only carrier: variance also shows sign, and cell
  states have an icon or text equivalent.

### 8. Look and feel

- Compact density by default, with `comfortable` and `compact` presets.
- Numbers right-aligned with `tabular-nums`; row headers left-aligned
  with indentation per level.
- Everything themed through `--nga-grid-*` variables that fall back to
  the design tokens, like every other primitive.

### 9. Column filters in the header

- A leaf column can declare a filter. Its header shows a filter button
  that opens a popover; a column with an active filter is marked, and
  the grid exposes a "clear all filters" command.
- Built-in filter types:

  | Type | Operators |
  |---|---|
  | `text` | contains, starts with, equals, is empty |
  | `number` | =, ≠, >, ≥, <, ≤, between, is empty — compared on the raw value, not the formatted text |
  | `set` | pick from the distinct values of the column (with search) |
  | custom | the app supplies the popover content through a template |

- Filter state is a model: `filters` maps a column id to its filter, so
  the app can read, persist and restore it.
- **Two modes**, chosen by the app:
  - *client* (default) — the core applies the filters to the rows it
    holds. In a tree, a row that matches keeps its ancestors visible so
    it stays in context; ancestors that do not match themselves are
    shown dimmed.
  - *external* — the grid only shows the UI and emits `filtersChange`;
    the app filters (typically on the server) and passes rows back. This
    is the mode to use with paging, where the grid does not hold all the
    rows.
- Filtering is presentation, not business logic, which is why the client
  mode fits the "no business rules" line. The same line still applies to
  totals: **the grid does not recalculate a parent because some of its
  children were filtered out.** It shows the values it was given. An app
  that wants filtered totals uses external mode and returns them.
- The popover uses the shared `overlay` entry, so `grid` depends on
  `grid-core` and `overlay`.
- Filters are keyboard-operable: a shortcut opens the active column's
  filter, focus moves into the popover and returns to the header cell on
  close.

### 10. Sorting

- A sortable column header cycles ascending → descending → none on
  click, and exposes `aria-sort`. `sort` is a model, like `filters`.
- **In a hierarchy, sorting orders siblings within each parent.** The
  tree shape never changes: children stay under their parent, and total
  rows stay where the app put them relative to their group.
- Values are compared raw: numbers numerically (decimal strings
  included), text with a locale-aware, numeric-aware collator. Empty
  values sort last in both directions.
- One sort column in v1. The model is a list so multi-column sorting can
  be added without an API change.
- Same two modes as filters: *client* (the core sorts what it holds) and
  *external* (the grid emits `sortChange` and the app returns sorted
  rows — the mode to use with paging).

## Out of scope for v1

| Excluded | Reason |
|---|---|
| Pivot/OLAP engine (drag dimensions to rows/columns) | A product feature above the grid. The grid renders whatever row and column trees it is given. |
| Formula engine, spreading strategies, client-side rollups | Business logic belongs to the app in this version. Cells can be marked `calculated`. A future variant may add formulas and common calculation logic on top of the same core. |
| `.xlsx` export | Not possible without a dependency. CSV/TSV export is included. |
| Global search / quick-filter box, saved filter views | The `filters` model lets the app build both. |
| Charts, sparklines | Separate primitives, if ever. |
| Variable row heights, row/column drag-reorder | Deferred to keep the viewport math and v1 scope tight. |
| Built-in data fetching, caching or pager UI | The grid emits the visible range and expand events; fetching and paging UI are the app's. |
| RTL and touch-first interaction | Desktop, LTR, pointer and keyboard for v1. Nothing in the design blocks adding them. |
| Built-in note/comment popover | v1 shows a marker on cells with a note and emits an event; the app shows the content. |

## Alternatives considered

| Option | Why not |
|---|---|
| **Wrap AG Grid** | Tree data, range selection and clipboard are Enterprise features under a commercial license. It is also a large runtime dependency, which breaks the project's core promise. |
| **TanStack Table as the core** | Headless and good, but still a dependency, and it leaves the hard parts for this domain (two-axis virtualization, panes, editing, clipboard) to us anyway. |
| **Canvas rendering** | Fastest at extreme sizes, but it forfeits native accessibility, text selection, CSS theming with tokens and easy customization — the reasons people adopt a copy-in library. DOM virtualization is sufficient for the target sizes. |
| **Native `<table>` with `position: sticky`** | Simple, but it cannot virtualize columns, and sticky breaks down with multi-level pinned headers at scale. |
| **One monolithic component** | Simpler to start, but every variant would fork it. The core/renderer split costs little up front and pays for itself with the second variant. |

## Consequences

**Positive**

- A grid that speaks the domain's language out of the box, which no
  copy-in Angular library offers today.
- Zero dependencies preserved; the core is reusable and testable alone.
- Variants are configurations, not forks.

**Negative / risks**

- **Largest piece in the library by far.** It will outweigh all current
  primitives combined, and it must be maintained.
- **Virtualization plus accessibility is hard to get right**: focus
  retention, screen-reader row/column counts, and scroll sync between
  panes are the likely sources of bugs.
- **Performance needs a budget and a benchmark** from day one, or it
  will regress silently.
- **`grid-core` needs real tests.** The primitives package has no test
  runner today; this ADR makes adding one a prerequisite.
- Copy-in distribution of a multi-file, two-entry component stresses the
  registry more than anything so far.

## Resolved questions

| Question | Decision |
|---|---|
| Is editing in v1? | **Yes.** v1 covers both read-only reporting and data entry. |
| Size targets | Tuned for **100k rows × 500 columns** in memory, with **no hard limit**: above that the app pages by scroll or with a pager, as it prefers. |
| Spreading | **Not in the grid.** It only emits the change; the app applies its rules and returns treated data. |
| Formulas and business rules | **Not in this version.** Possibly a later variant on the same core. |
| Value representation | Grid is agnostic; docs default to `number`, with decimal strings documented for precision-critical amounts. *(Assumed — not yet confirmed.)* |
| Cell notes | Marker plus event only. *(Assumed.)* |
| Lazy children | In v1, as an event the app answers. *(Follows from the paging decision.)* |
| RTL and touch | Out of v1. *(Assumed.)* |
| Sorting | **In v1.** Siblings within each parent, single column, client and external modes. |
| Column filters | **In v1**, in the column header: text, number, set and custom, with client and external modes. |

## Execution

See `docs/superpowers/plans/2026-11-13-data-grid.md`.
