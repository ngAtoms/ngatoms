/**
 * @file API table of the docs pages: the props, outputs or fields of a
 * component, shown with the library's own grid.
 */

import { Component, computed, input, signal } from "@angular/core";
import {
  type GridColumn,
  type GridFilters,
  type GridRow,
  NgAtomsGridCellDirective,
  NgAtomsGridComponent,
} from "../grid";

/** One documented prop. Older pages name the last two fields `default` and `desc`. */
export interface DocsProp {
  name: string;
  type: string;
  defaultVal?: string;
  default?: string;
  description?: string;
  desc?: string;
}

/** What a row of the table holds. */
interface PropLine {
  name: string;
  type: string;
  defaultVal: string;
  description: string;
}

/** Tables longer than this get a filter on the name column. */
const FILTER_FROM = 8;

/** Height of a row, enough for two lines of description, in px. */
const ROW_HEIGHT = 52;

/** Renders a list of props as a grid sized to its rows. */
@Component({
  selector: "app-props-table",
  standalone: true,
  imports: [NgAtomsGridComponent, NgAtomsGridCellDirective],
  templateUrl: "./props-table.component.html",
  styleUrl: "./props-table.component.css",
})
export class PropsTableComponent {
  readonly props = input.required<readonly DocsProp[]>();
  /** Accessible name of the table. */
  readonly label = input("Properties");

  protected readonly rowHeight = ROW_HEIGHT;
  protected readonly filters = signal<GridFilters<PropLine>>({});

  protected readonly rows = computed<GridRow<PropLine>[]>(() =>
    this.props().map((prop) => ({
      id: prop.name,
      data: {
        name: prop.name,
        type: prop.type,
        defaultVal: prop.defaultVal ?? prop.default ?? "",
        description: prop.description ?? prop.desc ?? "",
      },
    })),
  );

  protected readonly columns = computed<GridColumn<PropLine>[]>(() => [
    { id: "name", header: "Prop", width: 180, filter: this.props().length > FILTER_FROM ? "text" : undefined },
    { id: "type", header: "Type", width: 210, wrap: true },
    { id: "defaultVal", header: "Default", width: 120, wrap: true },
    { id: "description", header: "Description", width: 260, flex: 1, wrap: true },
  ]);
}
