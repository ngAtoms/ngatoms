/**
 * @file Row model: indexes the flat rows the app supplies into a tree and
 * lists the rows currently on show, in display order. Also provides the
 * windowed list used when flat data is paged by scroll.
 */

import { GridRow, GridRowId, GridVisibleRow } from './types';

/** Flat rows indexed by parent. */
export interface GridRowTree<T = unknown> {
  byId: Map<GridRowId, GridRow<T>>;
  /** Children by parent id, in the order the rows were given. */
  childrenOf: Map<GridRowId, GridRow<T>[]>;
  roots: GridRow<T>[];
}

/**
 * Read access to the rows on show.
 * An interface rather than an array, so a list paged by scroll can stand
 * in for a million rows without allocating a million entries.
 */
export interface GridRowList<T = unknown> {
  readonly length: number;
  /** Entry at a display position. */
  get(index: number): GridVisibleRow<T>;
  /** Display position of a row, or -1 when it is not in the list. */
  indexOf(id: GridRowId): number;
}

/** What decides which rows are listed, and in which order. */
export interface GridFlattenOptions<T = unknown> {
  /** Ids of the expanded rows. */
  expanded?: ReadonlySet<GridRowId>;
  /**
   * Result of `applyFilters`. Only `visible` rows are listed; those not in
   * `matched` are context for a matching descendant and come out `dimmed`.
   * While a filter is on, branches leading to a match are shown open
   * regardless of `expanded`.
   */
  filter?: { matched: ReadonlySet<GridRowId>; visible: ReadonlySet<GridRowId> } | null;
  /** Orders siblings within each parent. The shape of the tree never changes. */
  compare?: ((a: GridRow<T>, b: GridRow<T>) => number) | null;
}

/** Whether a row names a usable parent: one that exists and is not itself. */
function hasKnownParent<T>(row: GridRow<T>, byId: Map<GridRowId, GridRow<T>>): boolean {
  const parentId = row.parentId;
  return parentId !== null && parentId !== undefined && parentId !== row.id && byId.has(parentId);
}

/**
 * Indexes flat rows by `parentId`.
 * A row whose parent is not in the list becomes a root rather than being
 * dropped, so a partial load still shows. Rows caught in a parent cycle
 * are unreachable from any root and are not listed.
 */
export function buildRowTree<T>(rows: readonly GridRow<T>[]): GridRowTree<T> {
  const byId = new Map<GridRowId, GridRow<T>>();
  for (const row of rows) byId.set(row.id, row);

  const childrenOf = new Map<GridRowId, GridRow<T>[]>();
  const roots: GridRow<T>[] = [];

  for (const row of rows) {
    if (!hasKnownParent(row, byId)) {
      roots.push(row);
      continue;
    }
    const parentId = row.parentId as GridRowId;
    const siblings = childrenOf.get(parentId);
    if (siblings) siblings.push(row);
    else childrenOf.set(parentId, [row]);
  }

  return { byId, childrenOf, roots };
}

/**
 * Lists the ancestors of a row, nearest first.
 * Stops at the first repeated id, so malformed data with a parent cycle
 * cannot loop forever.
 */
export function ancestorsOf<T>(tree: GridRowTree<T>, id: GridRowId): GridRowId[] {
  const ancestors: GridRowId[] = [];
  const seen = new Set<GridRowId>([id]);
  let parentId = tree.byId.get(id)?.parentId;
  while (parentId !== null && parentId !== undefined && tree.byId.has(parentId) && !seen.has(parentId)) {
    ancestors.push(parentId);
    seen.add(parentId);
    parentId = tree.byId.get(parentId)?.parentId;
  }
  return ancestors;
}

/** Row list backed by an array of entries, for data held in memory. */
class ArrayRowList<T> implements GridRowList<T> {
  private positions: Map<GridRowId, number> | null = null;

  constructor(private readonly entries: GridVisibleRow<T>[]) {}

  /** @inheritdoc */
  get length(): number {
    return this.entries.length;
  }

  /** @inheritdoc */
  get(index: number): GridVisibleRow<T> {
    return this.entries[index];
  }

  /**
   * @inheritdoc
   * The id index is built on first use: most renders never look a row up by id.
   */
  indexOf(id: GridRowId): number {
    this.positions ??= this.indexPositions();
    return this.positions.get(id) ?? -1;
  }

  /** Maps each row id to its display position. */
  private indexPositions(): Map<GridRowId, number> {
    const positions = new Map<GridRowId, number>();
    this.entries.forEach((entry, index) => {
      if (entry.kind === 'row') positions.set(entry.row.id, index);
    });
    return positions;
  }
}

/** Row list for flat data paged by scroll: loaded rows by position, placeholders elsewhere. */
class WindowedRowList<T> implements GridRowList<T> {
  readonly length: number;
  private readonly byIndex = new Map<number, GridRow<T>>();
  private readonly positions = new Map<GridRowId, number>();

  constructor(rows: readonly GridRow<T>[], rowCount: number) {
    this.length = Math.max(rowCount, 0);
    rows.forEach((row, arrayIndex) => {
      const index = row.index ?? arrayIndex;
      this.byIndex.set(index, row);
      this.positions.set(row.id, index);
    });
  }

  /** @inheritdoc */
  get(index: number): GridVisibleRow<T> {
    const row = this.byIndex.get(index);
    if (!row) return { kind: 'placeholder', index };
    return { kind: 'row', row, level: 1, hasChildren: false, expanded: false, dimmed: false };
  }

  /** @inheritdoc */
  indexOf(id: GridRowId): number {
    return this.positions.get(id) ?? -1;
  }
}

/**
 * Decides whether a row's children are listed.
 * Normally that is the expanded state. Under a filter, a branch is open
 * exactly when it leads to a visible row, so matches are never hidden
 * inside a collapsed parent.
 */
function isBranchOpen<T>(row: GridRow<T>, children: GridRow<T>[] | undefined, options: GridFlattenOptions<T>): boolean {
  if (!children?.length) return false;
  const { filter, expanded } = options;
  if (filter) return children.some(child => filter.visible.has(child.id));
  return !!expanded?.has(row.id);
}

/** Placeholder rows shown under an open row while its children load. */
export const LOADING_CHILD_ROWS = 3;

/**
 * Whether a row is open and waiting for children the app has not
 * supplied: it says it has them (`hasChildren`) and none are loaded.
 */
function isLoadingChildren<T>(row: GridRow<T>, children: GridRow<T>[] | undefined, options: GridFlattenOptions<T>): boolean {
  return !!row.hasChildren && !children?.length && !!options.expanded?.has(row.id);
}

/**
 * Lists the rows on show, depth-first: children appear right under their
 * parent, and only while it is open. An open row whose children are
 * still loading is followed by placeholders.
 * Uses an explicit stack, because a recursive walk would overflow the
 * call stack on very deep hierarchies.
 */
export function flattenRows<T>(tree: GridRowTree<T>, options: GridFlattenOptions<T> = {}): GridRowList<T> {
  const { filter, compare } = options;
  const entries: GridVisibleRow<T>[] = [];

  /** Siblings in display order, on a copy so the tree is never reordered. */
  const ordered = (rows: GridRow<T>[]): GridRow<T>[] => (compare ? [...rows].sort(compare) : rows);

  const lists: GridRow<T>[][] = [ordered(tree.roots)];
  const cursors: number[] = [0];

  while (lists.length) {
    const depth = lists.length - 1;
    const cursor = cursors[depth]++;
    if (cursor >= lists[depth].length) {
      lists.pop();
      cursors.pop();
      continue;
    }

    const row = lists[depth][cursor];
    if (filter && !filter.visible.has(row.id)) continue;

    const children = tree.childrenOf.get(row.id);
    const open = isBranchOpen(row, children, options);
    const loading = isLoadingChildren(row, children, options);

    entries.push({
      kind: 'row',
      row,
      level: depth + 1,
      hasChildren: !!children?.length || !!row.hasChildren,
      expanded: open || loading,
      dimmed: !!filter && !filter.matched.has(row.id),
    });

    for (let ghost = 0; loading && ghost < LOADING_CHILD_ROWS; ghost++) {
      entries.push({ kind: 'placeholder', index: entries.length, level: depth + 2 });
    }

    if (open && children) {
      lists.push(ordered(children));
      cursors.push(0);
    }
  }

  return new ArrayRowList(entries);
}

/**
 * Builds the row list for flat data paged by scroll.
 * Each loaded row sits at its `index` (or its array position when it has
 * none); every other position reads as a placeholder. Filtering and
 * sorting are the app's job in this mode, since the grid does not hold
 * all the rows.
 *
 * @param rows The rows loaded so far.
 * @param rowCount Size of the full result.
 */
export function windowedRows<T>(rows: readonly GridRow<T>[], rowCount: number): GridRowList<T> {
  return new WindowedRowList(rows, rowCount);
}
