/**
 * @file Demo data for the grid docs page: a product sales tree, a flat
 * stock list, an editable plan and a large generated data set. Totals are
 * computed here, by the "app" — the grid only displays what it is given.
 */

import { GridCellChange, GridColumnNode, GridNumberFormat, GridRow, GridRowMove } from "../../../components/grid";

/** Record behind each row of the sales tree. Month keys are `m1`…`m12`. */
export type SalesLine = { name: string } & Record<string, number | string>;

/** Record behind each row of the stock list. */
export interface StockLine {
  warehouse: string;
  category: string;
  product: string;
  supplier: string | null;
  inStock: number;
  reorderLevel: number;
  difference: number;
}

/** Record behind each row of the editable plan. Month keys are `m1`…`m6`. */
export type PlanLine = { name: string } & Record<string, number | string | null>;

/** Record behind each row of the large data set. */
export interface ScaleLine {
  name: string;
  seed: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_KEYS = MONTHS.map((_, month) => `m${month + 1}`);
const UNITS: GridNumberFormat = { decimals: 0, negative: "parentheses", zero: "–" };
const PERCENT: GridNumberFormat = { style: "percent", decimals: 1, negative: "parentheses", zero: "–" };

/** Months of the editable plan, and how many of them are already closed. */
const PLAN_MONTHS = 6;
const PLAN_LOCKED_MONTHS = 2;

/** A product: name, parent group, typical monthly units and whether lower is better. */
interface Product {
  id: string;
  parentId: string;
  name: string;
  base: number;
  lowerIsBetter: boolean;
}

const PRODUCTS: Product[] = [
  { id: "headphones", parentId: "audio", name: "Headphones", base: 420, lowerIsBetter: false },
  { id: "speakers", parentId: "audio", name: "Speakers", base: 260, lowerIsBetter: false },
  { id: "soundbars", parentId: "audio", name: "Soundbars", base: 140, lowerIsBetter: false },
  { id: "laptops", parentId: "computing", name: "Laptops", base: 310, lowerIsBetter: false },
  { id: "monitors", parentId: "computing", name: "Monitors", base: 190, lowerIsBetter: false },
  { id: "kettles", parentId: "kitchen", name: "Kettles", base: 230, lowerIsBetter: false },
  { id: "blenders", parentId: "kitchen", name: "Blenders", base: 170, lowerIsBetter: false },
  { id: "toasters", parentId: "kitchen", name: "Toasters", base: 0, lowerIsBetter: false },
  { id: "desks", parentId: "furniture", name: "Desks", base: 90, lowerIsBetter: false },
  { id: "chairs", parentId: "furniture", name: "Chairs", base: 150, lowerIsBetter: false },
  { id: "damaged", parentId: "returns", name: "Damaged in transit", base: 38, lowerIsBetter: true },
  { id: "wrong-item", parentId: "returns", name: "Wrong item", base: 21, lowerIsBetter: true },
  { id: "changed-mind", parentId: "returns", name: "Changed mind", base: 46, lowerIsBetter: true },
];

/** Deterministic pseudo-random number in [0, 1) from two integers. */
function noise(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Adds the comparison columns, derived from the year total and the target. */
function withDifference(data: SalesLine): SalesLine {
  const year = Number(data["year"]);
  const target = Number(data["target"]);
  data["difference"] = year - target;
  data["differencePct"] = target ? (year - target) / target : 0;
  return data;
}

/** Monthly units, year total, target and differences for one product. */
function productData(product: Product, position: number): SalesLine {
  const data: SalesLine = { name: product.name };
  let total = 0;
  MONTH_KEYS.forEach((key, month) => {
    const units = Math.round(product.base * (0.8 + noise(position, month) * 0.45));
    data[key] = units;
    total += units;
  });
  data["year"] = total;
  data["target"] = Math.round(product.base * 12 * (0.95 + noise(position, 99) * 0.14));
  return withDifference(data);
}

/** Sums the unit columns of several records into a new one. */
function sumOf(name: string, parts: SalesLine[], sign: (index: number) => number = () => 1): SalesLine {
  const data: SalesLine = { name };
  for (const key of [...MONTH_KEYS, "year", "target"]) {
    data[key] = parts.reduce((total, part, index) => total + sign(index) * Number(part[key]), 0);
  }
  return withDifference(data);
}

/** Builds the sales tree, with every total computed by the app. */
export function buildSalesRows(): GridRow<SalesLine>[] {
  const records = new Map(PRODUCTS.map((product, position) => [product.id, productData(product, position)]));

  /** Records of the products under a group. */
  const under = (parentId: string): SalesLine[] =>
    PRODUCTS.filter((product) => product.parentId === parentId).map((product) => records.get(product.id)!);

  /** Rows of the products under a group. */
  const productRows = (parentId: string): GridRow<SalesLine>[] =>
    PRODUCTS.filter((product) => product.parentId === parentId).map((product) => ({
      id: product.id,
      parentId,
      data: records.get(product.id)!,
      favorable: product.lowerIsBetter ? "lower" : "higher",
    }));

  const audio = sumOf("Audio", under("audio"));
  const computing = sumOf("Computing", under("computing"));
  const electronics = sumOf("Electronics", [audio, computing]);
  const kitchen = sumOf("Kitchen", under("kitchen"));
  const furniture = sumOf("Furniture", under("furniture"));
  const home = sumOf("Home", [kitchen, furniture]);
  const sold = sumOf("Units sold", [electronics, home]);
  const returns = sumOf("Returns", under("returns"));
  const net = sumOf("Net units", [sold, returns], (index) => (index === 0 ? 1 : -1));

  const returnRate: SalesLine = { name: "Return rate" };
  for (const key of [...MONTH_KEYS, "year", "target"]) {
    returnRate[key] = Number(returns[key]) / Number(sold[key]);
  }
  returnRate["difference"] = Number(returnRate["year"]) - Number(returnRate["target"]);
  returnRate["differencePct"] = "";

  return [
    { id: "electronics", data: electronics },
    { id: "audio", parentId: "electronics", data: audio },
    ...productRows("audio"),
    { id: "computing", parentId: "electronics", data: computing },
    ...productRows("computing"),
    { id: "home", data: home },
    { id: "kitchen", parentId: "home", data: kitchen },
    ...productRows("kitchen"),
    { id: "furniture", parentId: "home", data: furniture },
    ...productRows("furniture"),
    { id: "sold", data: sold, kind: "subtotal" },
    { id: "returns", data: returns, favorable: "lower" },
    ...productRows("returns"),
    { id: "net", data: net, kind: "total" },
    { id: "return-rate", data: returnRate, format: PERCENT, favorable: "lower" },
  ];
}

/** Columns of the sales tree: pinned name, months by quarter, target comparison, pinned year total. */
export function buildSalesColumns(): GridColumnNode<SalesLine>[] {
  const quarters = [0, 1, 2, 3].map((quarter) => ({
    id: `q${quarter + 1}`,
    header: `Q${quarter + 1}`,
    children: [0, 1, 2].map((offset) => {
      const month = quarter * 3 + offset;
      return { id: MONTH_KEYS[month], header: MONTHS[month], type: "number" as const, width: 96, format: UNITS };
    }),
  }));

  return [
    { id: "name", header: "Product", width: 230, pinned: "left", tree: true, filter: "text", sortable: true },
    { id: "units", header: "Units 2026", children: quarters },
    {
      id: "comparison",
      header: "Against target",
      children: [
        { id: "target", header: "Target", type: "number", width: 110, format: UNITS },
        { id: "difference", header: "Diff", type: "number", width: 100, format: UNITS, variance: true },
        { id: "differencePct", header: "Diff %", type: "number", width: 84, format: PERCENT, variance: true },
      ],
    },
    { id: "year", header: "Year", type: "number", width: 120, pinned: "right", format: UNITS, sortable: true },
  ];
}

const STOCK_WAREHOUSES = ["Lisbon", "São Paulo", "Toronto", "Berlin"];
const STOCK_CATEGORIES = ["Audio", "Computing", "Kitchen", "Furniture", "Lighting", "Storage"];
const STOCK_PRODUCTS = ["Standard", "Compact", "Pro", "Travel", "Studio", "Outdoor"];
const STOCK_SUPPLIERS = ["Northwind", "Bluepeak", "Corvin", "Halden", null];

/** Builds a flat stock list: one line per warehouse, category and product. */
export function buildStockRows(): GridRow<StockLine>[] {
  const rows: GridRow<StockLine>[] = [];
  STOCK_WAREHOUSES.forEach((warehouse, w) => {
    STOCK_CATEGORIES.forEach((category, c) => {
      STOCK_PRODUCTS.forEach((product, p) => {
        const position = w * 100 + c * 10 + p;
        const reorderLevel = Math.round((40 + noise(position, 1) * 460) / 10) * 10;
        const inStock = Math.round(reorderLevel * (0.4 + noise(position, 2) * 1.6));
        rows.push({
          id: `${warehouse}-${category}-${product}`,
          data: {
            warehouse,
            category,
            product: `${category} ${product}`,
            supplier: STOCK_SUPPLIERS[Math.floor(noise(position, 3) * STOCK_SUPPLIERS.length)],
            inStock,
            reorderLevel,
            difference: inStock - reorderLevel,
          },
        });
      });
    });
  });
  return rows;
}

/**
 * Columns of the stock list: a single header row, no groups.
 *
 * @param interactive Adds sorting to every column and a filter suited to its values.
 */
export function buildStockColumns(interactive: boolean): GridColumnNode<StockLine>[] {
  const sortable = interactive;
  /** The filter type for a column, or none when the grid is not interactive. */
  const filter = <F extends "text" | "number" | "set">(type: F): F | undefined => (interactive ? type : undefined);

  return [
    { id: "warehouse", header: "Warehouse", width: 120, sortable, filter: filter("set") },
    { id: "category", header: "Category", width: 120, sortable, filter: filter("set") },
    { id: "product", header: "Product", width: 170, sortable, filter: filter("text") },
    { id: "supplier", header: "Supplier", width: 120, sortable, filter: filter("set") },
    { id: "inStock", header: "In stock", type: "number", width: 110, format: UNITS, sortable, filter: filter("number") },
    {
      id: "reorderLevel",
      header: "Reorder at",
      type: "number",
      width: 110,
      format: UNITS,
      sortable,
      filter: filter("number"),
    },
    {
      id: "difference",
      header: "Diff",
      type: "number",
      width: 100,
      format: UNITS,
      variance: true,
      sortable,
      filter: filter("number"),
    },
  ];
}

/** Key of a plan month column, 0-based. */
function planKey(month: number): string {
  return `m${month + 1}`;
}

/** Whether a plan column is a closed month, which cannot be edited. */
export function isPlanMonthLocked(columnId: string): boolean {
  return MONTH_KEYS.slice(0, PLAN_LOCKED_MONTHS).includes(columnId);
}

/** Builds the leaf rows of the editable plan; group and total rows are derived by `withPlanTotals`. */
export function buildPlanLeaves(): GridRow<PlanLine>[] {
  return PRODUCTS.filter((product) => !product.lowerIsBetter && product.base > 0)
    .slice(0, 7)
    .map((product, position) => {
      const data: PlanLine = { name: product.name };
      for (let month = 0; month < PLAN_MONTHS; month++) {
        data[planKey(month)] = Math.round((product.base * (0.9 + noise(position, month) * 0.2)) / 10) * 10;
      }
      return { id: product.id, parentId: product.parentId, data };
    });
}

/**
 * The app's side of an edit: applies the changes the grid emitted to the
 * leaf rows. Rows are replaced, never mutated, so signals see the change.
 */
export function applyPlanChanges(leaves: GridRow<PlanLine>[], changes: GridCellChange[]): GridRow<PlanLine>[] {
  return leaves.map((row) => {
    const own = changes.filter((change) => change.rowId === row.id);
    if (!own.length) return row;
    const data = { ...row.data };
    for (const change of own) data[change.columnId] = change.next as number | null;
    return { ...row, data };
  });
}

/** Adds the group rows and the grand total, each summed from its leaves by the app. */
export function withPlanTotals(leaves: GridRow<PlanLine>[]): GridRow<PlanLine>[] {
  /** A row whose month values are the sums of the given leaves. */
  const total = (id: string, name: string, parts: GridRow<PlanLine>[], kind?: "total"): GridRow<PlanLine> => {
    const data: PlanLine = { name };
    for (let month = 0; month < PLAN_MONTHS; month++) {
      data[planKey(month)] = parts.reduce((sum, part) => sum + Number(part.data[planKey(month)] ?? 0), 0);
    }
    return { id, data, kind };
  };

  const groups = [...new Set(leaves.map((row) => String(row.parentId)))];
  const rows: GridRow<PlanLine>[] = [];
  for (const group of groups) {
    const members = leaves.filter((row) => row.parentId === group);
    rows.push(total(group, group.charAt(0).toUpperCase() + group.slice(1), members), ...members);
  }
  return [...rows, total("all", "All products", leaves, "total")];
}

/** Columns of the editable plan: the product name and six editable months. */
export function buildPlanColumns(): GridColumnNode<PlanLine>[] {
  return [
    { id: "name", header: "Product", width: 200, pinned: "left", tree: true },
    ...Array.from({ length: PLAN_MONTHS }, (_, month) => ({
      id: planKey(month),
      header: MONTHS[month],
      type: "number" as const,
      width: 88,
      format: UNITS,
      editable: true,
    })),
  ];
}

/**
 * Builds a large tree: `groups` parents with `itemsPerGroup` children.
 * Rows carry only a seed; cell values are derived on read, so the data
 * set costs a few megabytes instead of holding every cell.
 */
export function buildScaleRows(groups: number, itemsPerGroup: number): GridRow<ScaleLine>[] {
  const rows: GridRow<ScaleLine>[] = [];
  for (let group = 0; group < groups; group++) {
    const groupId = `g${group}`;
    rows.push({ id: groupId, data: { name: `Group ${group + 1}`, seed: group }, kind: "subtotal" });
    for (let item = 0; item < itemsPerGroup; item++) {
      rows.push({
        id: `${groupId}-${item}`,
        parentId: groupId,
        data: { name: `Item ${String(item + 1).padStart(4, "0")}`, seed: group * itemsPerGroup + item },
      });
    }
  }
  return rows;
}

/** Builds `count` period columns grouped by year and quarter, plus the pinned name column. */
export function buildScaleColumns(count: number): GridColumnNode<ScaleLine>[] {
  const nodes: GridColumnNode<ScaleLine>[] = [{ id: "name", header: "Item", width: 220, pinned: "left", tree: true }];
  const years = Math.ceil(count / 12);
  for (let year = 0; year < years; year++) {
    nodes.push({
      id: `y${year}`,
      header: `${2000 + year}`,
      children: [0, 1, 2, 3].map((quarter) => ({
        id: `y${year}q${quarter}`,
        header: `Q${quarter + 1}`,
        children: [0, 1, 2].map((offset) => {
          const period = year * 12 + quarter * 3 + offset;
          return {
            id: `p${period}`,
            header: MONTHS[quarter * 3 + offset],
            type: "number" as const,
            width: 92,
            format: UNITS,
            valueGetter: (row: GridRow<ScaleLine>) => Math.round((noise(row.data.seed, period) - 0.2) * 90000),
          };
        }),
      })),
    });
  }
  return nodes;
}

/** Record behind each row of the paged order list. */
export interface OrderLine {
  order: string;
  customer: string;
  city: string;
  items: number;
  total: number;
}

/** Record behind each row of the tree that loads its children on demand. */
export interface RegionLine {
  name: string;
  stores: number | null;
  units: number;
}

/** Size of the order list the mock server holds. */
export const ORDER_COUNT = 50_000;

/** How long the mock server takes to answer, in ms. */
const SERVER_DELAY = 350;

const ORDER_CUSTOMERS = ["Alder & Co", "Brightline", "Cedar Works", "Dovetail", "Elm Street", "Foxglove", "Greyfield"];
const ORDER_CITIES = ["Lisbon", "Porto", "Madrid", "Lyon", "Milan", "Vienna", "Prague", "Dublin"];
const MONEY: GridNumberFormat = { decimals: 2 };

/** Resolves a value after the mock server's delay. */
function afterDelay<V>(value: V): Promise<V> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SERVER_DELAY));
}

/** The order at a position of the full list. `index` tells the grid where the row belongs. */
function orderAt(index: number): GridRow<OrderLine> {
  const items = 1 + Math.floor(noise(index, 3) * 12);
  return {
    id: `order-${index}`,
    index,
    data: {
      order: `#${String(100000 + index)}`,
      customer: ORDER_CUSTOMERS[Math.floor(noise(index, 1) * ORDER_CUSTOMERS.length)],
      city: ORDER_CITIES[Math.floor(noise(index, 2) * ORDER_CITIES.length)],
      items,
      total: Math.round(items * (12 + noise(index, 4) * 180) * 100) / 100,
    },
  };
}

/** Stands in for a server: answers one slice of the orders. */
export function fetchOrders(start: number, end: number): Promise<GridRow<OrderLine>[]> {
  const rows: GridRow<OrderLine>[] = [];
  for (let index = start; index < Math.min(end, ORDER_COUNT); index++) rows.push(orderAt(index));
  return afterDelay(rows);
}

/** Columns of the order list. */
export function buildOrderColumns(): GridColumnNode<OrderLine>[] {
  return [
    { id: "order", header: "Order", width: 110 },
    { id: "customer", header: "Customer", width: 170 },
    { id: "city", header: "City", width: 130 },
    { id: "items", header: "Items", type: "number", width: 90, format: UNITS },
    { id: "total", header: "Total", type: "number", width: 120, format: MONEY },
  ];
}

const REGIONS = ["Iberia", "Central Europe", "Nordics", "British Isles"];

/** The regions, each flagged as having children the app has not loaded. */
export function buildRegionRows(): GridRow<RegionLine>[] {
  return REGIONS.map((name, region) => {
    const stores = 3 + Math.floor(noise(region, 7) * 4);
    let units = 0;
    for (let store = 0; store < stores; store++) units += storeUnits(region, store);
    return { id: `region-${region}`, hasChildren: true, data: { name, stores, units } };
  });
}

/** Units of one store of a region. */
function storeUnits(region: number, store: number): number {
  return 400 + Math.floor(noise(region * 31 + store, 9) * 2600);
}

/** Stands in for a server: answers the stores of one region. */
export function fetchRegionStores(regionId: string | number): Promise<GridRow<RegionLine>[]> {
  const region = Number(String(regionId).replace("region-", ""));
  const stores = 3 + Math.floor(noise(region, 7) * 4);
  const rows: GridRow<RegionLine>[] = [];
  for (let store = 0; store < stores; store++) {
    rows.push({
      id: `${regionId}-store-${store}`,
      parentId: regionId,
      data: { name: `${REGIONS[region]} store ${store + 1}`, stores: null, units: storeUnits(region, store) },
    });
  }
  return afterDelay(rows);
}

/** Columns of the region tree. */
export function buildRegionColumns(): GridColumnNode<RegionLine>[] {
  return [
    { id: "name", header: "Region", tree: true, width: 260 },
    { id: "stores", header: "Stores", type: "number", width: 100, format: UNITS },
    { id: "units", header: "Units", type: "number", width: 120, format: UNITS },
  ];
}

/** Record behind each row of the task list. */
export interface TaskLine {
  task: string;
  status: string | null;
  due: string | null;
  done: boolean | null;
}

/** Statuses a task can have. */
export const TASK_STATUSES = ["Planned", "In progress", "Blocked", "Done"];

/** A small task tree: two phases with their tasks. */
export function buildTaskRows(): GridRow<TaskLine>[] {
  /** Builds a phase row. */
  const phase = (id: string, task: string): GridRow<TaskLine> => ({
    id,
    data: { task, status: null, due: null, done: null },
  });
  /** Builds a task row under a phase. */
  const task = (id: string, parentId: string, name: string, status: string, due: string): GridRow<TaskLine> => ({
    id,
    parentId,
    data: { task: name, status, due, done: status === "Done" },
  });
  return [
    phase("design", "Design"),
    task("research", "design", "Interview five customers", "Done", "2026-11-03"),
    task("wireframes", "design", "Wireframes for the checkout", "In progress", "2026-11-18"),
    task("review", "design", "Design review", "Planned", "2026-11-24"),
    phase("build", "Build"),
    task("api", "build", "Orders endpoint", "In progress", "2026-12-02"),
    task("payments", "build", "Payment provider contract", "Blocked", "2026-12-05"),
    task("emails", "build", "Confirmation emails", "Planned", "2026-12-12"),
  ];
}

/** Columns of the task list. Status and due date are edited with the app's own controls. */
export function buildTaskColumns(): GridColumnNode<TaskLine>[] {
  return [
    { id: "task", header: "Task", tree: true, width: 300, editable: true },
    { id: "status", header: "Status", width: 150, editable: true },
    { id: "due", header: "Due", width: 150, editable: true },
    { id: "done", header: "Done", width: 80, resizable: false },
  ];
}

/** Applies a batch of edits to the tasks. */
export function applyTaskChanges(rows: GridRow<TaskLine>[], changes: GridCellChange[]): GridRow<TaskLine>[] {
  const byRow = new Map<string | number, GridCellChange[]>();
  for (const change of changes) byRow.set(change.rowId, [...(byRow.get(change.rowId) ?? []), change]);
  return rows.map((row) => {
    const edits = byRow.get(row.id);
    if (!edits) return row;
    const data = { ...row.data } as Record<string, unknown>;
    for (const edit of edits) data[edit.columnId] = edit.next;
    return { ...row, data: data as unknown as TaskLine };
  });
}

/**
 * Moves a task where it was dropped. Siblings keep the order of the
 * array, so placing the row next to its target is all it takes; a row
 * dropped inside another becomes its last child.
 */
export function moveTaskRow(rows: GridRow<TaskLine>[], move: GridRowMove): GridRow<TaskLine>[] {
  const row = rows.find((candidate) => candidate.id === move.rowId);
  const rest = rows.filter((candidate) => candidate.id !== move.rowId);
  const targetIndex = rest.findIndex((candidate) => candidate.id === move.targetId);
  if (!row || targetIndex < 0) return rows;

  const target = rest[targetIndex];
  const moved = { ...row, parentId: move.position === "inside" ? target.id : target.parentId };
  const at = move.position === "before" ? targetIndex : move.position === "after" ? targetIndex + 1 : rest.length;
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}
