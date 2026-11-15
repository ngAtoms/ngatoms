/**
 * @file Keyboard shortcuts table of the docs pages: every shortcut of a
 * component, for Windows / Linux and for macOS, shown with the grid.
 */

import { Component, computed, input } from "@angular/core";
import { type GridColumn, type GridRow, NgAtomsGridComponent } from "../grid";

/** One shortcut: what it does and the keys on each platform. */
export interface DocsShortcut {
  action: string;
  windows: string;
  /** Keys on macOS; leave out when they are the same as on Windows. */
  mac?: string;
}

/** What a row of the table holds. */
interface ShortcutLine {
  action: string;
  windows: string;
  mac: string;
}

/** Height of a row, enough for two lines, in px. */
const ROW_HEIGHT = 44;

/** Renders a list of shortcuts as a grid sized to its rows. */
@Component({
  selector: "app-shortcuts-table",
  standalone: true,
  imports: [NgAtomsGridComponent],
  template: `
    <nga-grid
      [rows]="rows()"
      [columns]="columns"
      [rowHeight]="rowHeight"
      [fitRows]="true"
      label="Keyboard shortcuts"
    />
  `,
  styles: `
    :host {
      display: block;
      margin: 12px 0;
    }
  `,
})
export class ShortcutsTableComponent {
  readonly shortcuts = input.required<readonly DocsShortcut[]>();

  protected readonly rowHeight = ROW_HEIGHT;
  protected readonly columns: GridColumn<ShortcutLine>[] = [
    { id: "action", header: "Action", width: 220, flex: 1, wrap: true },
    { id: "windows", header: "Windows / Linux", width: 230, wrap: true },
    { id: "mac", header: "macOS", width: 230, wrap: true },
  ];

  protected readonly rows = computed<GridRow<ShortcutLine>[]>(() =>
    this.shortcuts().map((shortcut, index) => ({
      id: index,
      data: { action: shortcut.action, windows: shortcut.windows, mac: shortcut.mac ?? shortcut.windows },
    })),
  );
}
