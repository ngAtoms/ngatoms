import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsDrawerComponent,
  NgAtomsDrawerHeaderDirective,
  NgAtomsDrawerTitleDirective,
  NgAtomsDrawerDescriptionDirective,
  NgAtomsDrawerBodyDirective,
  NgAtomsDrawerFooterDirective,
  NgAtomsDrawerCloseDirective,
} from "../../../components/drawer";
import {
  NgAtomsButtonDirective,
} from "../../../components/button";
import type { NgAtomsDrawerSide, NgAtomsDrawerSize } from "../../../components/drawer";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-drawer-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsDrawerComponent,
    NgAtomsDrawerHeaderDirective,
    NgAtomsDrawerTitleDirective,
    NgAtomsDrawerDescriptionDirective,
    NgAtomsDrawerBodyDirective,
    NgAtomsDrawerFooterDirective,
    NgAtomsDrawerCloseDirective,
    NgAtomsButtonDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./drawer-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./drawer-page.component.css",
})
export class DrawerPageComponent {
  readonly heroOpen = signal(false);
  readonly sideOpen = signal(false);
  readonly side = signal<NgAtomsDrawerSide>("left");
  readonly sizeOpen = signal(false);
  readonly size = signal<NgAtomsDrawerSize>("sm");

  openSide(side: NgAtomsDrawerSide): void {
    this.side.set(side);
    this.sideOpen.set(true);
  }

  openSize(size: NgAtomsDrawerSize): void {
    this.size.set(size);
    this.sizeOpen.set(true);
  }

  readonly heroCode = "<button ngAtomsButton variant=\"outline\" (click)=\"open.set(true)\">Open drawer</button>\n\n<nga-drawer [(open)]=\"open\" label=\"Edit profile\">\n  <div ngAtomsDrawerHeader>\n    <div>\n      <h2 ngAtomsDrawerTitle>Edit profile</h2>\n      <p ngAtomsDrawerDescription>Changes are saved to your account.</p>\n    </div>\n    <button ngAtomsDrawerClose><i class=\"ph ph-x\"></i></button>\n  </div>\n  <div ngAtomsDrawerBody>…</div>\n  <div ngAtomsDrawerFooter>\n    <button ngAtomsButton variant=\"ghost\" (click)=\"open.set(false)\">Cancel</button>\n    <button ngAtomsButton (click)=\"open.set(false)\">Save</button>\n  </div>\n</nga-drawer>";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport {\n  NgAtomsDrawerComponent,\n  NgAtomsDrawerHeaderDirective,\n  NgAtomsDrawerTitleDirective,\n  NgAtomsDrawerDescriptionDirective,\n  NgAtomsDrawerBodyDirective,\n  NgAtomsDrawerFooterDirective,\n  NgAtomsDrawerCloseDirective,\n} from './ui/drawer';\n\n@Component({\n  standalone: true,\n  imports: [\n    NgAtomsDrawerComponent,\n    NgAtomsDrawerHeaderDirective,\n    NgAtomsDrawerTitleDirective,\n    NgAtomsDrawerDescriptionDirective,\n    NgAtomsDrawerBodyDirective,\n    NgAtomsDrawerFooterDirective,\n    NgAtomsDrawerCloseDirective,\n  ],\n  templateUrl: './my.component.html',\n})\nexport class MyComponent {\n  readonly open = signal(false);\n}";

  readonly codeSides = "<nga-drawer [(open)]=\"open\" side=\"left\">…</nga-drawer>\n<nga-drawer [(open)]=\"open\" side=\"right\">…</nga-drawer>\n<nga-drawer [(open)]=\"open\" side=\"top\">…</nga-drawer>\n<nga-drawer [(open)]=\"open\" side=\"bottom\">…</nga-drawer>";

  readonly codeSizes = "<nga-drawer [(open)]=\"open\" size=\"sm\">…</nga-drawer>\n<nga-drawer [(open)]=\"open\" size=\"md\">…</nga-drawer>\n<nga-drawer [(open)]=\"open\" size=\"lg\">…</nga-drawer>\n<nga-drawer [(open)]=\"open\" size=\"full\">…</nga-drawer>";

  readonly codeDismiss = "<nga-drawer [(open)]=\"open\" [dismissible]=\"false\">…</nga-drawer>";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-drawer",
      props: [
        { name: "open", type: "boolean (model)", defaultVal: "false", description: "Two-way binding for the open state." },
        { name: "side", type: "'left' | 'right' | 'top' | 'bottom'", defaultVal: "'right'", description: "Edge the drawer slides from." },
        { name: "size", type: "'sm' | 'md' | 'lg' | 'full'", defaultVal: "'md'", description: "Width (left/right) or height (top/bottom)." },
        { name: "dismissible", type: "boolean", defaultVal: "true", description: "Closes when the backdrop is clicked." },
        { name: "label", type: "string", defaultVal: "''", description: "Accessible name of the dialog." },
      ],
    },
    {
      kind: "Directives",
      target: "drawer",
      props: [
        { name: "ngAtomsDrawerHeader", type: "div", defaultVal: "—", description: "Top row holding the title and close button." },
        { name: "ngAtomsDrawerTitle", type: "h2", defaultVal: "—", description: "Drawer title." },
        { name: "ngAtomsDrawerDescription", type: "p", defaultVal: "—", description: "Supporting text under the title." },
        { name: "ngAtomsDrawerBody", type: "div", defaultVal: "—", description: "Scrollable content area." },
        { name: "ngAtomsDrawerFooter", type: "div", defaultVal: "—", description: "Bottom row for actions." },
        { name: "ngAtomsDrawerClose", type: "button", defaultVal: "—", description: "Closes the drawer on click." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "lock", title: "Focus trap", body: "While open, focus stays inside the drawer and the rest of the page is inert. Closing returns focus to the element that opened it." },
    { icon: "keyboard", title: "Keyboard", body: "Escape closes the drawer. Tab cycles through its focusable content." },
    { icon: "tag", title: "Naming", body: "Set the label input so the dialog is announced with a name, for example the same text as its title." },
    { icon: "wind", title: "Reduced motion", body: "The slide animation is removed under prefers-reduced-motion: reduce." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "sides", label: "Sides" },
    { id: "sizes", label: "Sizes" },
    { id: "dismiss", label: "Dismissal" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
