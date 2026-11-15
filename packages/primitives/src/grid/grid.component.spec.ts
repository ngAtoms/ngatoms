/**
 * @file Specs for the grid component: keyboard selection, accessible
 * names, and axe in jsdom. jsdom does not evaluate color contrast, so
 * that axe rule stays off.
 */

import { Component, provideZonelessChangeDetection, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { GridColumnNode, GridRow, GridRowId, GridRowMove } from '../grid-core';
import { NgAtomsGridComponent } from './grid.component';

interface Line {
  name: string;
  a: number;
  b: number;
}

const rows: GridRow<Line>[] = [
  { id: 'r1', data: { name: 'One', a: 1, b: 2 } },
  { id: 'r2', data: { name: 'Two', a: 3, b: 4 } },
];

const columns: GridColumnNode<Line>[] = [
  { id: 'name', header: 'Name', width: 160 },
  { id: 'a', header: 'A', width: 80, editable: true },
  { id: 'b', header: 'B', width: 80, editable: true },
];

/** A viewport stub the tests can resize after the grid has measured itself. */
interface ResizeStub {
  apply(width: number, height: number): void;
}

const resizeStubs: ResizeStub[] = [];

/** Sets a real viewport size. Until then the center pane draws no cells. */
class ResizeObserverStub {
  private target?: Element;

  constructor(private readonly callback: ResizeObserverCallback) {
    resizeStubs.push(this);
  }

  observe(target: Element): void {
    this.target = target;
    this.apply(1200, 600);
  }

  unobserve(): void {}

  disconnect(): void {}

  apply(width: number, height: number): void {
    if (!this.target) return;
    Object.defineProperty(this.target, 'clientWidth', { configurable: true, value: width });
    Object.defineProperty(this.target, 'clientHeight', { configurable: true, value: height });
    this.callback([], this as unknown as ResizeObserver);
  }
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
});

async function mount<T>(component: Type<T>): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  TestBed.tick();
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function gridOf(fixture: ComponentFixture<unknown>, index = 0): HTMLElement {
  const grids = fixture.nativeElement.querySelectorAll('[role="grid"], [role="treegrid"]');
  return grids[index] as HTMLElement;
}

async function focusGrid(fixture: ComponentFixture<unknown>, index = 0): Promise<HTMLElement> {
  const grid = gridOf(fixture, index);
  grid.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  fixture.detectChanges();
  await fixture.whenStable();
  TestBed.tick();
  return grid;
}

async function key(fixture: ComponentFixture<unknown>, grid: HTMLElement, init: KeyboardEventInit): Promise<void> {
  grid.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  fixture.detectChanges();
  await fixture.whenStable();
  TestBed.tick();
}

/** Joins the text of the nodes `aria-labelledby` points at. Those nodes must not name themselves. */
function referencedName(root: ParentNode, element: Element): string {
  const ids = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  expect(ids.length).toBeGreaterThan(0);
  return ids
    .map(id => {
      const node = root.querySelector(`[id="${id}"]`);
      expect(node, id).toBeTruthy();
      expect(node!.getAttribute('aria-labelledby'), id).toBeNull();
      return (node!.textContent ?? '').replace(/\s+/g, ' ').trim();
    })
    .join(' ');
}

/** Lets the test set `scrollLeft` without jsdom clamping it to the unlaid-out width. */
function setScrollLeft(element: HTMLElement, value: number): void {
  Object.defineProperty(element, 'scrollLeft', {
    configurable: true,
    get: () => value,
    set: () => undefined,
  });
  element.dispatchEvent(new Event('scroll'));
}

/** Lets `scrollTop` move the rendered window: jsdom keeps it at 0 and fires no scroll. */
function liveScrollTop(element: HTMLElement): void {
  let value = 0;
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => value,
    set: (next: number) => {
      value = Math.max(0, next);
      element.dispatchEvent(new Event('scroll'));
    },
  });
}

/** Sends a key to the element that has focus, the way the browser does. */
async function keyOnFocus(fixture: ComponentFixture<unknown>, init: KeyboardEventInit): Promise<void> {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  for (let pass = 0; pass < 2; pass++) {
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();
  }
}

describe('nga-grid', () => {
  it('keeps focus in the grid on Ctrl+↓, Ctrl+End, Ctrl+Home and Ctrl+↑ across the rendered window', async () => {
    const fixture = await mount(TallGrid);
    const grid = gridOf(fixture);
    liveScrollTop(grid);
    await focusGrid(fixture);
    (grid.querySelector('.nga-grid__cell--active') as HTMLElement).focus();
    expect(grid.contains(document.activeElement)).toBe(true);

    const activeRow = () =>
      grid.querySelector('.nga-grid__cell--active')?.closest('[role="row"]')?.getAttribute('aria-rowindex');
    const steps: [KeyboardEventInit, string][] = [
      [{ key: 'ArrowDown', ctrlKey: true }, '301'],
      [{ key: 'Home', ctrlKey: true }, '2'],
      [{ key: 'End', ctrlKey: true }, '301'],
      [{ key: 'ArrowUp', ctrlKey: true }, '2'],
    ];
    for (const [init, row] of steps) {
      await keyOnFocus(fixture, init);
      expect(document.activeElement, init.key).not.toBe(document.body);
      expect(grid.contains(document.activeElement), init.key).toBe(true);
      expect(activeRow(), init.key).toBe(row);
    }

    await keyOnFocus(fixture, { key: 'ArrowDown' });
    expect(grid.contains(document.activeElement)).toBe(true);
    expect(activeRow()).toBe('3');
  });

  it('names a row header from its column and its value, and a cell from the row, the column and its value', async () => {
    const fixture = await mount(TwoGrids);
    const first = gridOf(fixture, 0);
    const second = gridOf(fixture, 1);
    const rowHeader = first.querySelector('[role="rowheader"]') as HTMLElement;
    const cell = first.querySelector('[role="gridcell"]') as HTMLElement;

    expect(referencedName(fixture.nativeElement, rowHeader)).toBe('Name One');
    expect(referencedName(fixture.nativeElement, cell)).toBe('One A 1');
    const rowLabelId = (cell.getAttribute('aria-labelledby') ?? '').split(/\s+/).find(id => id.includes('-r-'));
    expect(rowLabelId).toMatch(/^nga-grid-\d+-r-/);
    expect(first.contains(fixture.nativeElement.querySelector(`[id="${rowLabelId}"]`))).toBe(false);

    const prefixes = new Set(
      [...fixture.nativeElement.querySelectorAll('[id]')].map(node =>
        (node as HTMLElement).id.match(/^nga-grid-\d+/)?.[0],
      ),
    );
    expect(prefixes.size).toBe(2);
    expect(second.querySelector('[role="gridcell"]')).toBeTruthy();
  });

  it('keeps the referenced row label after the row header column scrolls out', async () => {
    const fixture = await mount(WideGrid);
    const grid = gridOf(fixture);
    resizeStubs.at(-1)?.apply(100, 600);
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();

    setScrollLeft(grid, 300);
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();

    expect(grid.querySelector('[role="rowheader"]')).toBeNull();
    const cell = grid.querySelector('[role="gridcell"]') as HTMLElement;
    const ids = (cell.getAttribute('aria-labelledby') ?? '').split(/\s+/);
    const rowLabelId = ids.find(id => id.includes('-r-'));
    const label = fixture.nativeElement.querySelector(`[id="${rowLabelId}"]`);
    expect(label).toBeTruthy();
    expect(grid.contains(label)).toBe(false);
    expect(referencedName(fixture.nativeElement, cell)).toBe('Alpha H1 Bravo');
  });

  it('is a treegrid with levels while announced children have not loaded yet', async () => {
    const fixture = await mount(LazyTreeGrid);
    const grid = gridOf(fixture);
    expect(grid.getAttribute('role')).toBe('treegrid');
    const rowsShown = [...grid.querySelectorAll('[role="row"][aria-expanded]')];
    expect(rowsShown).toHaveLength(2);
    for (const row of rowsShown) expect(row.getAttribute('aria-level')).toBe('1');

    const results = await axe.run(fixture.nativeElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations.map(violation => violation.id)).not.toContain('aria-conditional-attr');
  });

  it('moves a row past an expanded sibling with Alt+↓ and back with Alt+↑', async () => {
    const fixture = await mount(ReorderTreeGrid);
    const grid = await focusGrid(fixture);
    const host = fixture.componentInstance;

    // The host records moves without applying them, so positions are those of p1, a, b, p2, c.
    await key(fixture, grid, { key: 'ArrowDown', altKey: true });
    expect(host.moves).toEqual([{ rowId: 'p1', targetId: 'p2', position: 'after' }]);

    // The active cell went to p1's landing place, which in unchanged data is b, the last child of p1.
    await key(fixture, grid, { key: 'ArrowDown', altKey: true });
    expect(host.moves).toHaveLength(1);
    await key(fixture, grid, { key: 'ArrowUp', altKey: true });
    expect(host.moves[1]).toEqual({ rowId: 'b', targetId: 'a', position: 'before' });

    // From p2, Alt+↑ skips p1's children and lands before p1.
    await key(fixture, grid, { key: 'ArrowDown' });
    await key(fixture, grid, { key: 'ArrowDown' });
    await key(fixture, grid, { key: 'ArrowUp', altKey: true });
    expect(host.moves[2]).toEqual({ rowId: 'p2', targetId: 'p1', position: 'before' });
  });

  it('keeps the filter open when the values list scrolls', async () => {
    const fixture = await mount(FilterGrid);
    const button = fixture.nativeElement.querySelector('.nga-grid__header-filter') as HTMLElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();

    const list = document.querySelector('.nga-grid-filter__options') as HTMLElement;
    expect(list).toBeTruthy();
    list.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();

    expect(document.querySelector('.nga-grid-filter')).toBeTruthy();
    fixture.destroy();
  });

  it('does not expand or collapse a tree row when the arrow key has a modifier', async () => {
    const fixture = await mount(TreeGrid);
    const grid = await focusGrid(fixture);
    const expanded = () => grid.querySelector('[aria-expanded]')?.getAttribute('aria-expanded');

    expect(expanded()).toBe('false');
    await key(fixture, grid, { key: 'ArrowRight', shiftKey: true });
    await key(fixture, grid, { key: 'ArrowRight', ctrlKey: true });
    await key(fixture, grid, { key: 'ArrowRight', altKey: true });
    await key(fixture, grid, { key: 'ArrowRight', metaKey: true });
    expect(expanded()).toBe('false');
    expect(grid.textContent).not.toContain('Child');

    await key(fixture, grid, { key: 'ArrowRight' });
    expect(expanded()).toBe('true');
    expect(grid.textContent).toContain('Child');
  });

  it('selects the active row with Shift+Space and the active column with Ctrl+Space', async () => {
    const fixture = await mount(OneGrid);
    const grid = await focusGrid(fixture);

    await key(fixture, grid, { key: 'ArrowDown' });
    await key(fixture, grid, { key: 'ArrowRight' });
    await key(fixture, grid, { key: ' ', shiftKey: true });

    const selected = (rowIndex: string) =>
      grid.querySelectorAll(`[role="row"][aria-rowindex="${rowIndex}"] [aria-selected="true"]`);
    expect(selected('3')).toHaveLength(3);
    expect(selected('2')).toHaveLength(0);
    expect((grid.querySelector('[role="row"][aria-rowindex="3"] [role="rowheader"]') as HTMLElement).tabIndex).toBe(0);

    await key(fixture, grid, { key: 'ArrowRight' });
    await key(fixture, grid, { key: ' ', ctrlKey: true });

    expect(grid.querySelectorAll('[aria-colindex="2"][aria-selected="true"]')).toHaveLength(2);
    expect(grid.querySelectorAll('[aria-colindex="1"][aria-selected="true"]')).toHaveLength(0);
    expect(grid.querySelectorAll('[aria-colindex="3"][aria-selected="true"]')).toHaveLength(0);
  });

  it('copies aria-label from the host onto the grid', async () => {
    const fixture = await mount(HostLabel);
    const grid = gridOf(fixture);
    expect(grid.getAttribute('aria-label')).toBe('Ledger');
    expect(grid.getAttribute('aria-labelledby')).toBeNull();
  });

  it('copies aria-labelledby from the host onto the grid', async () => {
    const fixture = await mount(HostLabelledBy);
    const grid = gridOf(fixture);
    expect(grid.getAttribute('aria-labelledby')).toBe('ledger-title');
    expect(grid.getAttribute('aria-label')).toBeNull();
  });

  it('runs axe in jsdom with color contrast off', async () => {
    const fixture = await mount(OneGrid);
    await focusGrid(fixture);
    const results = await axe.run(fixture.nativeElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    const detail = results.violations.map(
      violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(' | ')}`,
    );
    expect(detail, detail.join('\n')).toEqual([]);
  });

  it('runs axe in jsdom on a grid with no name, color contrast off', async () => {
    const fixture = await mount(UnnamedGrid);
    await focusGrid(fixture);
    const results = await axe.run(fixture.nativeElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    const detail = results.violations.map(
      violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(' | ')}`,
    );
    expect(detail, detail.join('\n')).toEqual([]);
  });
});

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" label="Accounts" />`,
})
class OneGrid {
  readonly rows = rows;
  readonly columns = columns;
}

interface WideLine {
  c0: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
}

const wideColumns: GridColumnNode<WideLine>[] = [
  { id: 'c0', header: 'H0', width: 100 },
  { id: 'c1', header: 'H1', width: 100 },
  { id: 'c2', header: 'H2', width: 100 },
  { id: 'c3', header: 'H3', width: 100 },
  { id: 'c4', header: 'H4', width: 100 },
];

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" label="Tall" />`,
})
class TallGrid {
  readonly rows: GridRow<Line>[] = Array.from({ length: 300 }, (_, i) => ({
    id: `t${i}`,
    data: { name: `Row ${i}`, a: i, b: i * 2 },
  }));
  readonly columns = columns;
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" label="Wide" />`,
})
class WideGrid {
  readonly rows: GridRow<WideLine>[] = [
    { id: 'w1', data: { c0: 'Alpha', c1: 'Bravo', c2: 'Charlie', c3: 'Delta', c4: 'Echo' } },
  ];
  readonly columns = wideColumns;
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid aria-label="Ledger" [rows]="rows" [columns]="columns" />`,
})
class HostLabel {
  readonly rows = rows;
  readonly columns = columns;
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `
    <span id="ledger-title">Ledger</span>
    <nga-grid aria-labelledby="ledger-title" [rows]="rows" [columns]="columns" />
  `,
})
class HostLabelledBy {
  readonly rows = rows;
  readonly columns = columns;
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" />`,
})
class UnnamedGrid {
  readonly rows = rows;
  readonly columns = columns;
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `
    <nga-grid [rows]="rows" [columns]="columns" label="First" />
    <nga-grid [rows]="rows" [columns]="columns" label="Second" />
  `,
})
class TwoGrids {
  readonly rows = rows;
  readonly columns = columns;
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" label="Filtered" />`,
})
class FilterGrid {
  readonly rows: GridRow<Line>[] = rows;
  readonly columns: GridColumnNode<Line>[] = [{ id: 'name', header: 'Name', width: 160, filter: 'set' }];
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" label="Tree" />`,
})
class TreeGrid {
  readonly rows: GridRow<{ name: string }>[] = [
    { id: 'p', data: { name: 'Parent' } },
    { id: 'c', data: { name: 'Child' }, parentId: 'p' },
  ];
  readonly columns: GridColumnNode<{ name: string }>[] = [{ id: 'name', header: 'Name', width: 160, tree: true }];
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid [rows]="rows" [columns]="columns" label="Regions" />`,
})
class LazyTreeGrid {
  readonly rows: GridRow<{ name: string }>[] = [
    { id: 'north', hasChildren: true, data: { name: 'North' } },
    { id: 'south', hasChildren: true, data: { name: 'South' } },
  ];
  readonly columns: GridColumnNode<{ name: string }>[] = [{ id: 'name', header: 'Name', width: 160, tree: true }];
}

@Component({
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `<nga-grid
    [rows]="rows"
    [columns]="columns"
    [expanded]="expanded"
    [rowReorder]="true"
    (rowMove)="moves.push($event)"
    label="Phases"
  />`,
})
class ReorderTreeGrid {
  readonly moves: GridRowMove[] = [];
  readonly expanded: ReadonlySet<GridRowId> = new Set(['p1', 'p2']);
  readonly rows: GridRow<{ name: string }>[] = [
    { id: 'p1', data: { name: 'Plan' } },
    { id: 'a', parentId: 'p1', data: { name: 'Scope' } },
    { id: 'b', parentId: 'p1', data: { name: 'Budget' } },
    { id: 'p2', data: { name: 'Build' } },
    { id: 'c', parentId: 'p2', data: { name: 'Code' } },
  ];
  readonly columns: GridColumnNode<{ name: string }>[] = [{ id: 'name', header: 'Name', width: 160, tree: true }];
}
