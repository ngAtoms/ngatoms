import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsTreeComponent,
  NgAtomsTreeItemComponent,
  NgAtomsTreeItemIconDirective,
} from "../../../components/tree";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";
import { PropsTableComponent } from "../../../components/props-table/props-table.component";
import { type DocsShortcut, ShortcutsTableComponent } from "../../../components/shortcuts-table/shortcuts-table.component";

@Component({
  selector: "app-tree-page",
  standalone: true,
  imports: [ShortcutsTableComponent, PropsTableComponent, 
    RouterLink,
    NgAtomsTreeComponent,
    NgAtomsTreeItemComponent,
    NgAtomsTreeItemIconDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./tree-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./tree-page.component.css",
})
export class TreePageComponent {
  readonly shortcuts: DocsShortcut[] = [
    { action: "Move through the visible items", windows: "↓ / ↑" },
    { action: "Expand a branch, or enter it", windows: "→" },
    { action: "Collapse a branch, or go to the parent", windows: "←" },
    { action: "First / last item", windows: "Home / End", mac: "Fn+← / Fn+→" },
    { action: "Select the focused item", windows: "Enter or Space", mac: "Return or Space" },
  ];

  readonly heroSelected = signal<string | null>("app.component.ts");
  readonly plainSelected = signal<string | null>(null);
  readonly docsExpanded = signal(true);

  readonly heroCode = "<nga-tree [(selected)]=\"selected\" label=\"Project files\">\n  <nga-tree-item value=\"src\" label=\"src\" [expanded]=\"true\">\n    <i ngAtomsTreeItemIcon class=\"ph ph-folder\"></i>\n    <nga-tree-item value=\"app\" label=\"app\" [expanded]=\"true\">\n      <i ngAtomsTreeItemIcon class=\"ph ph-folder\"></i>\n      <nga-tree-item value=\"app.component.ts\" label=\"app.component.ts\">\n        <i ngAtomsTreeItemIcon class=\"ph ph-file-ts\"></i>\n      </nga-tree-item>\n      <nga-tree-item value=\"app.routes.ts\" label=\"app.routes.ts\">\n        <i ngAtomsTreeItemIcon class=\"ph ph-file-ts\"></i>\n      </nga-tree-item>\n    </nga-tree-item>\n    <nga-tree-item value=\"styles.css\" label=\"styles.css\">\n      <i ngAtomsTreeItemIcon class=\"ph ph-file-css\"></i>\n    </nga-tree-item>\n  </nga-tree-item>\n  <nga-tree-item value=\"package.json\" label=\"package.json\">\n    <i ngAtomsTreeItemIcon class=\"ph ph-file\"></i>\n  </nga-tree-item>\n</nga-tree>";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport {\n  NgAtomsTreeComponent,\n  NgAtomsTreeItemComponent,\n  NgAtomsTreeItemIconDirective,\n} from './ui/tree';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsTreeComponent, NgAtomsTreeItemComponent, NgAtomsTreeItemIconDirective],\n  templateUrl: './my.component.html',\n})\nexport class MyComponent {\n  readonly selected = signal<string | null>(null);\n}";

  readonly codeExpanded = "<nga-tree label=\"Documentation\">\n  <nga-tree-item value=\"docs\" label=\"Docs\" [(expanded)]=\"docsExpanded\">\n    <nga-tree-item value=\"intro\" label=\"Introduction\" />\n    <nga-tree-item value=\"install\" label=\"Installation\" />\n    <nga-tree-item value=\"theming\" label=\"Theming\" />\n  </nga-tree-item>\n</nga-tree>";

  readonly codeData = "<nga-tree [(selected)]=\"selected\" label=\"Categories\">\n  <ng-container *ngTemplateOutlet=\"branch; context: { $implicit: nodes }\" />\n</nga-tree>\n\n<ng-template #branch let-nodes>\n  @for (node of nodes; track node.id) {\n    <nga-tree-item [value]=\"node.id\" [label]=\"node.name\">\n      @if (node.children?.length) {\n        <ng-container *ngTemplateOutlet=\"branch; context: { $implicit: node.children }\" />\n      }\n    </nga-tree-item>\n  }\n</ng-template>";

  readonly codeDisabled = "<nga-tree-item value=\"billing\" label=\"Billing\" [disabled]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-tree",
      props: [
        { name: "selected", type: "string | null (model)", defaultVal: "null", description: "Two-way binding for the value of the selected item." },
        { name: "label", type: "string", defaultVal: "''", description: "Accessible name of the tree." },
      ],
    },
    {
      kind: "Inputs",
      target: "nga-tree-item",
      props: [
        { name: "value", type: "string", defaultVal: "required", description: "Identifies the item for selection. Unique within the tree." },
        { name: "label", type: "string", defaultVal: "required", description: "Text of the item." },
        { name: "expanded", type: "boolean (model)", defaultVal: "false", description: "Two-way binding for the branch state." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents selecting the item." },
      ],
    },
    {
      kind: "Directives",
      target: "tree",
      props: [
        { name: "ngAtomsTreeItemIcon", type: "any element", defaultVal: "—", description: "Icon rendered before the label." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "Arrow Down/Up move through visible items. Arrow Right expands a branch or enters it; Arrow Left collapses it or moves to the parent. Home/End jump to the ends." },
    { icon: "check", title: "Selection", body: "Enter or Space selects the focused item. Clicking a row selects it and toggles its branch." },
    { icon: "list", title: "ARIA", body: "Items have role=\"treeitem\" with aria-level, aria-selected, and aria-expanded on branches. Children sit in a role=\"group\"." },
    { icon: "tag", title: "Naming", body: "Set label so the tree is announced with a name." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "expanded", label: "Controlling branches" },
    { id: "data", label: "From data" },
    { id: "disabled", label: "Disabled items" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
