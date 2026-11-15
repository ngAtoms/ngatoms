import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsContextMenuComponent,
  NgAtomsContextMenuTriggerDirective,
} from "../../../components/context-menu";
import {
  NgAtomsDropdownItemDirective,
  NgAtomsDropdownSeparatorDirective,
  NgAtomsDropdownLabelDirective,
} from "../../../components/dropdown-menu";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";
import { PropsTableComponent } from "../../../components/props-table/props-table.component";
import { type DocsShortcut, ShortcutsTableComponent } from "../../../components/shortcuts-table/shortcuts-table.component";

@Component({
  selector: "app-context-menu-page",
  standalone: true,
  imports: [ShortcutsTableComponent, PropsTableComponent, 
    RouterLink,
    NgAtomsContextMenuComponent,
    NgAtomsContextMenuTriggerDirective,
    NgAtomsDropdownItemDirective,
    NgAtomsDropdownSeparatorDirective,
    NgAtomsDropdownLabelDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./context-menu-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./context-menu-page.component.css",
})
export class ContextMenuPageComponent {
  readonly shortcuts: DocsShortcut[] = [
    { action: "Open from a focused trigger", windows: "Shift+F10 or the Menu key", mac: "⇧F10 (with Fn on keyboards with media keys)" },
    { action: "Move between items", windows: "↑ / ↓" },
    { action: "First / last item", windows: "Home / End", mac: "Fn+← / Fn+→" },
    { action: "Activate the item", windows: "Enter", mac: "Return" },
    { action: "Close", windows: "Esc" },
  ];

  readonly lastAction = signal("none");

  readonly heroCode = "<nga-context-menu>\n  <div ngAtomsContextMenuTrigger tabindex=\"0\">Right-click here</div>\n\n  <button ngAtomsDropdownItem (click)=\"copy()\">\n    <i class=\"ph-bold ph-copy\"></i> Copy\n  </button>\n  <button ngAtomsDropdownItem (click)=\"paste()\">\n    <i class=\"ph-bold ph-clipboard\"></i> Paste\n  </button>\n  <button ngAtomsDropdownItem [disabled]=\"true\">\n    <i class=\"ph-bold ph-share\"></i> Share\n  </button>\n  <div ngAtomsDropdownSeparator></div>\n  <button ngAtomsDropdownItem [destructive]=\"true\" (click)=\"remove()\">\n    <i class=\"ph-bold ph-trash\"></i> Delete\n  </button>\n</nga-context-menu>";

  readonly usageCode = "import { Component } from '@angular/core';\nimport {\n  NgAtomsContextMenuComponent,\n  NgAtomsContextMenuTriggerDirective,\n} from './ui/context-menu';\nimport {\n  NgAtomsDropdownItemDirective,\n  NgAtomsDropdownSeparatorDirective,\n  NgAtomsDropdownLabelDirective,\n} from './ui/dropdown-menu';\n\n@Component({\n  standalone: true,\n  imports: [\n    NgAtomsContextMenuComponent,\n    NgAtomsContextMenuTriggerDirective,\n    NgAtomsDropdownItemDirective,\n    NgAtomsDropdownSeparatorDirective,\n    NgAtomsDropdownLabelDirective,\n  ],\n  templateUrl: './my.component.html',\n})\nexport class MyComponent {}";

  readonly codeLabels = "<nga-context-menu>\n  <div ngAtomsContextMenuTrigger tabindex=\"0\">Right-click here</div>\n  <span ngAtomsDropdownLabel>Edit</span>\n  <button ngAtomsDropdownItem>Rename</button>\n  <button ngAtomsDropdownItem>Duplicate</button>\n  <div ngAtomsDropdownSeparator></div>\n  <span ngAtomsDropdownLabel>Organize</span>\n  <button ngAtomsDropdownItem>Move to…</button>\n  <button ngAtomsDropdownItem>Archive</button>\n</nga-context-menu>";

  readonly codeDisabled = "<nga-context-menu [disabled]=\"true\">…</nga-context-menu>";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-context-menu",
      props: [
        { name: "open", type: "boolean (model)", defaultVal: "false", description: "Two-way binding for the open state." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Leaves the native context menu in place." },
      ],
    },
    {
      kind: "Directives",
      target: "context-menu",
      props: [
        { name: "ngAtomsContextMenuTrigger", type: "any element", defaultVal: "—", description: "Area that opens the menu on right-click." },
        { name: "ngAtomsDropdownItem", type: "button", defaultVal: "—", description: "Menu action. Takes disabled and destructive." },
        { name: "ngAtomsDropdownSeparator", type: "div", defaultVal: "—", description: "Divider between groups." },
        { name: "ngAtomsDropdownLabel", type: "span", defaultVal: "—", description: "Group heading." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "Shift+F10 or the Menu key opens the menu from a focused trigger. Arrow keys move between items, Home/End jump, Enter activates, Escape closes." },
    { icon: "cursor-click", title: "Focusable trigger", body: "Add tabindex=\"0\" to a trigger that is not already focusable, or keyboard users cannot open the menu." },
    { icon: "arrow-u-up-left", title: "Focus return", body: "Closing with Escape or by choosing an item returns focus to where it was before the menu opened." },
    { icon: "list", title: "ARIA roles", body: "The panel has role=\"menu\" and items role=\"menuitem\". The trigger has aria-haspopup=\"menu\"." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "labels", label: "Labels and groups" },
    { id: "disabled", label: "Disabled" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
