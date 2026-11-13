/**
 * @file Demo data for the grid docs page: a small income statement and a
 * large generated data set. Totals are computed here, by the "app" — the
 * grid only displays what it is given.
 */

import { GridColumnNode, GridNumberFormat, GridRow } from "../../../components/grid";

/** Record behind each income statement row. Month keys are `m1`…`m12`. */
export type StatementLine = { name: string } & Record<string, number | string>;

/** Record behind each row of the cost center ledger. */
export interface LedgerLine {
  entity: string;
  costCenter: string;
  account: string;
  owner: string | null;
  actual: number;
  budget: number;
  variance: number;
}

/** Record behind each row of the large data set. */
export interface ScaleLine {
  name: string;
  seed: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AMOUNT: GridNumberFormat = { decimals: 0, negative: "parentheses", zero: "–" };
const PERCENT: GridNumberFormat = { style: "percent", decimals: 1, negative: "parentheses", zero: "–" };

/** A leaf account: name, parent, monthly base amount and whether lower is better. */
interface Account {
  id: string;
  parentId: string;
  name: string;
  base: number;
  cost: boolean;
}

const ACCOUNTS: Account[] = [
  { id: "hardware", parentId: "product", name: "Hardware", base: 42000, cost: false },
  { id: "software", parentId: "product", name: "Software licenses", base: 61000, cost: false },
  { id: "subscriptions", parentId: "product", name: "Subscriptions", base: 88000, cost: false },
  { id: "consulting", parentId: "services", name: "Consulting", base: 27000, cost: false },
  { id: "support", parentId: "services", name: "Support contracts", base: 19000, cost: false },
  { id: "materials", parentId: "cogs", name: "Materials", base: 31000, cost: true },
  { id: "hosting", parentId: "cogs", name: "Hosting", base: 14000, cost: true },
  { id: "support-staff", parentId: "cogs", name: "Support staff", base: 22000, cost: true },
  { id: "sm-payroll", parentId: "sales", name: "Payroll", base: 38000, cost: true },
  { id: "advertising", parentId: "sales", name: "Advertising", base: 12000, cost: true },
  { id: "travel", parentId: "sales", name: "Travel", base: 6000, cost: true },
  { id: "rd-payroll", parentId: "rd", name: "Payroll", base: 54000, cost: true },
  { id: "tools", parentId: "rd", name: "Tools and licenses", base: 7000, cost: true },
  { id: "rent", parentId: "ga", name: "Rent", base: 9000, cost: true },
  { id: "legal", parentId: "ga", name: "Legal", base: 4000, cost: true },
  { id: "insurance", parentId: "ga", name: "Insurance", base: 0, cost: true },
];

/** Deterministic pseudo-random number in [0, 1) from two integers. */
function noise(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Monthly actuals, full-year total, budget and variances for one leaf account. */
function leafData(account: Account, position: number): StatementLine {
  const data: StatementLine = { name: account.name };
  let total = 0;
  MONTHS.forEach((_, month) => {
    const amount = Math.round(account.base * (0.85 + noise(position, month) * 0.35));
    data[`m${month + 1}`] = amount;
    total += amount;
  });
  data["fy"] = total;
  data["budget"] = Math.round(account.base * 12 * (0.95 + noise(position, 99) * 0.12));
  return withVariance(data);
}

/** Adds the variance columns, derived from the full-year and budget amounts. */
function withVariance(data: StatementLine): StatementLine {
  const fy = Number(data["fy"]);
  const budget = Number(data["budget"]);
  data["variance"] = fy - budget;
  data["variancePct"] = budget ? (fy - budget) / budget : 0;
  return data;
}

/** Sums the amount columns of several records into a new one. */
function sumOf(name: string, parts: StatementLine[], sign: (index: number) => number = () => 1): StatementLine {
  const data: StatementLine = { name };
  const keys = [...MONTHS.map((_, month) => `m${month + 1}`), "fy", "budget"];
  for (const key of keys) {
    data[key] = parts.reduce((total, part, index) => total + sign(index) * Number(part[key]), 0);
  }
  return withVariance(data);
}

/** Builds the income statement rows, with every total computed by the app. */
export function buildStatementRows(): GridRow<StatementLine>[] {
  const leaves = new Map(ACCOUNTS.map((account, position) => [account.id, leafData(account, position)]));

  /** Records of the leaves under a parent. */
  const under = (parentId: string): StatementLine[] =>
    ACCOUNTS.filter((account) => account.parentId === parentId).map((account) => leaves.get(account.id)!);

  const product = sumOf("Product revenue", under("product"));
  const services = sumOf("Services revenue", under("services"));
  const revenue = sumOf("Revenue", [product, services]);
  const cogs = sumOf("Cost of sales", under("cogs"));
  const grossProfit = sumOf("Gross profit", [revenue, cogs], (index) => (index === 0 ? 1 : -1));
  const sales = sumOf("Sales and marketing", under("sales"));
  const rd = sumOf("Research and development", under("rd"));
  const ga = sumOf("General and administrative", under("ga"));
  const opex = sumOf("Operating expenses", [sales, rd, ga]);
  const operatingIncome = sumOf("Operating income", [grossProfit, opex], (index) => (index === 0 ? 1 : -1));

  const margin: StatementLine = { name: "Operating margin" };
  for (const key of [...MONTHS.map((_, month) => `m${month + 1}`), "fy", "budget"]) {
    margin[key] = Number(operatingIncome[key]) / Number(revenue[key]);
  }
  margin["variance"] = Number(margin["fy"]) - Number(margin["budget"]);
  margin["variancePct"] = "";

  /** Rows of the leaves under a parent. */
  const leafRows = (parentId: string): GridRow<StatementLine>[] =>
    ACCOUNTS.filter((account) => account.parentId === parentId).map((account) => ({
      id: account.id,
      parentId,
      data: leaves.get(account.id)!,
      favorable: account.cost ? "lower" : "higher",
    }));

  return [
    { id: "revenue", data: revenue },
    { id: "product", parentId: "revenue", data: product },
    ...leafRows("product"),
    { id: "services", parentId: "revenue", data: services },
    ...leafRows("services"),
    { id: "cogs", data: cogs, favorable: "lower" },
    ...leafRows("cogs"),
    { id: "gross-profit", data: grossProfit, kind: "subtotal" },
    { id: "opex", data: opex, favorable: "lower" },
    { id: "sales", parentId: "opex", data: sales, favorable: "lower" },
    ...leafRows("sales"),
    { id: "rd", parentId: "opex", data: rd, favorable: "lower" },
    ...leafRows("rd"),
    { id: "ga", parentId: "opex", data: ga, favorable: "lower" },
    ...leafRows("ga"),
    { id: "operating-income", data: operatingIncome, kind: "total" },
    { id: "margin", data: margin, format: PERCENT },
  ];
}

/** Columns of the income statement: pinned account, months by quarter, budget comparison, and a pinned full-year total. */
export function buildStatementColumns(): GridColumnNode<StatementLine>[] {
  const quarters = [0, 1, 2, 3].map((quarter) => ({
    id: `q${quarter + 1}`,
    header: `Q${quarter + 1}`,
    children: [0, 1, 2].map((offset) => {
      const month = quarter * 3 + offset;
      return { id: `m${month + 1}`, header: MONTHS[month], type: "number" as const, width: 96, format: AMOUNT };
    }),
  }));

  return [
    { id: "name", header: "Account", width: 230, pinned: "left", tree: true, filter: "text", sortable: true },
    { id: "actual", header: "Actual 2026", children: quarters },
    {
      id: "plan",
      header: "Against budget",
      children: [
        { id: "budget", header: "Budget", type: "number", width: 110, format: AMOUNT },
        { id: "variance", header: "Var", type: "number", width: 100, format: AMOUNT, variance: true },
        { id: "variancePct", header: "Var %", type: "number", width: 84, format: PERCENT, variance: true },
      ],
    },
    { id: "fy", header: "FY 2026", type: "number", width: 120, pinned: "right", format: AMOUNT, sortable: true },
  ];
}

/**
 * Builds a large tree: `entities` parents with `linesPerEntity` children.
 * Rows carry only a seed; cell values are derived on read, so the data
 * set costs a few megabytes instead of holding every cell.
 */
export function buildScaleRows(entities: number, linesPerEntity: number): GridRow<ScaleLine>[] {
  const rows: GridRow<ScaleLine>[] = [];
  for (let entity = 0; entity < entities; entity++) {
    const entityId = `e${entity}`;
    rows.push({ id: entityId, data: { name: `Entity ${entity + 1}`, seed: entity }, kind: "subtotal" });
    for (let line = 0; line < linesPerEntity; line++) {
      rows.push({
        id: `${entityId}-${line}`,
        parentId: entityId,
        data: { name: `Account ${String(line + 1).padStart(4, "0")}`, seed: entity * linesPerEntity + line },
      });
    }
  }
  return rows;
}

/** Builds `count` period columns grouped by year and quarter, plus the pinned name column. */
export function buildScaleColumns(count: number): GridColumnNode<ScaleLine>[] {
  const nodes: GridColumnNode<ScaleLine>[] = [{ id: "name", header: "Account", width: 220, pinned: "left", tree: true }];
  const years = Math.ceil(count / 12);
  for (let year = 0; year < years; year++) {
    nodes.push({
      id: `y${year}`,
      header: `FY ${2000 + year}`,
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
            format: AMOUNT,
            valueGetter: (row: GridRow<ScaleLine>) => Math.round((noise(row.data.seed, period) - 0.2) * 90000),
          };
        }),
      })),
    });
  }
  return nodes;
}

const LEDGER_ENTITIES = ["Portugal", "Brazil", "Canada", "Germany"];
const LEDGER_COST_CENTERS = ["Engineering", "Sales", "Marketing", "Operations", "People", "Support"];
const LEDGER_ACCOUNTS = ["Payroll", "Travel", "Software", "Contractors", "Training", "Office"];
const LEDGER_OWNERS = ["A. Costa", "M. Silva", "J. Tremblay", "K. Weber", null];

/** Builds a flat ledger: one line per entity, cost center and account. */
export function buildLedgerRows(): GridRow<LedgerLine>[] {
  const rows: GridRow<LedgerLine>[] = [];
  LEDGER_ENTITIES.forEach((entity, e) => {
    LEDGER_COST_CENTERS.forEach((costCenter, c) => {
      LEDGER_ACCOUNTS.forEach((account, a) => {
        const position = e * 100 + c * 10 + a;
        const budget = Math.round((4000 + noise(position, 1) * 46000) / 100) * 100;
        const actual = Math.round(budget * (0.8 + noise(position, 2) * 0.45));
        rows.push({
          id: `${entity}-${costCenter}-${account}`,
          favorable: "lower",
          data: {
            entity,
            costCenter,
            account,
            owner: LEDGER_OWNERS[Math.floor(noise(position, 3) * LEDGER_OWNERS.length)],
            actual,
            budget,
            variance: actual - budget,
          },
        });
      });
    });
  });
  return rows;
}

/**
 * Columns of the ledger: a single header row, no groups.
 *
 * @param interactive Adds sorting to every column and a filter suited to its values.
 */
export function buildLedgerColumns(interactive: boolean): GridColumnNode<LedgerLine>[] {
  const sortable = interactive;
  /** The filter type for a column, or none when the grid is not interactive. */
  const filter = <F extends "text" | "number" | "set">(type: F): F | undefined => (interactive ? type : undefined);

  return [
    { id: "entity", header: "Entity", width: 120, sortable, filter: filter("set") },
    { id: "costCenter", header: "Cost center", width: 140, sortable, filter: filter("set") },
    { id: "account", header: "Account", width: 140, sortable, filter: filter("text") },
    { id: "owner", header: "Owner", width: 120, sortable, filter: filter("set") },
    { id: "actual", header: "Actual", type: "number", width: 110, format: AMOUNT, sortable, filter: filter("number") },
    { id: "budget", header: "Budget", type: "number", width: 110, format: AMOUNT, sortable, filter: filter("number") },
    {
      id: "variance",
      header: "Var",
      type: "number",
      width: 110,
      format: AMOUNT,
      variance: true,
      sortable,
      filter: filter("number"),
    },
  ];
}
