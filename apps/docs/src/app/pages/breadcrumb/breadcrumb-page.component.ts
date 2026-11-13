import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsBreadcrumbDirective,
  NgAtomsBreadcrumbListDirective,
  NgAtomsBreadcrumbItemDirective,
  NgAtomsBreadcrumbLinkDirective,
  NgAtomsBreadcrumbPageDirective,
  NgAtomsBreadcrumbSeparatorDirective,
  NgAtomsBreadcrumbEllipsisDirective,
} from "../../../components/breadcrumb";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-breadcrumb-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsBreadcrumbDirective,
    NgAtomsBreadcrumbListDirective,
    NgAtomsBreadcrumbItemDirective,
    NgAtomsBreadcrumbLinkDirective,
    NgAtomsBreadcrumbPageDirective,
    NgAtomsBreadcrumbSeparatorDirective,
    NgAtomsBreadcrumbEllipsisDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./breadcrumb-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./breadcrumb-page.component.css",
})
export class BreadcrumbPageComponent {
  readonly heroCode = "<nav ngAtomsBreadcrumb>\n  <ol ngAtomsBreadcrumbList>\n    <li ngAtomsBreadcrumbItem><a ngAtomsBreadcrumbLink routerLink=\"/docs\">Docs</a></li>\n    <li ngAtomsBreadcrumbSeparator></li>\n    <li ngAtomsBreadcrumbItem><a ngAtomsBreadcrumbLink routerLink=\"/components\">Components</a></li>\n    <li ngAtomsBreadcrumbSeparator></li>\n    <li ngAtomsBreadcrumbItem><span ngAtomsBreadcrumbPage>Breadcrumb</span></li>\n  </ol>\n</nav>";

  readonly usageCode = "import { Component } from '@angular/core';\nimport { RouterLink } from '@angular/router';\nimport {\n  NgAtomsBreadcrumbDirective,\n  NgAtomsBreadcrumbListDirective,\n  NgAtomsBreadcrumbItemDirective,\n  NgAtomsBreadcrumbLinkDirective,\n  NgAtomsBreadcrumbPageDirective,\n  NgAtomsBreadcrumbSeparatorDirective,\n} from './ui/breadcrumb';\n\n@Component({\n  standalone: true,\n  imports: [\n    RouterLink,\n    NgAtomsBreadcrumbDirective,\n    NgAtomsBreadcrumbListDirective,\n    NgAtomsBreadcrumbItemDirective,\n    NgAtomsBreadcrumbLinkDirective,\n    NgAtomsBreadcrumbPageDirective,\n    NgAtomsBreadcrumbSeparatorDirective,\n  ],\n  templateUrl: './my.component.html',\n})\nexport class MyComponent {}";

  readonly codeSeparator = "<li ngAtomsBreadcrumbSeparator>\n  <i class=\"ph ph-caret-right\"></i>\n</li>";

  readonly codeCollapsed = "<li ngAtomsBreadcrumbItem>\n  <span ngAtomsBreadcrumbEllipsis></span>\n</li>";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "[ngAtomsBreadcrumb]",
      props: [
        { name: "label", type: "string", defaultVal: "'Breadcrumb'", description: "Accessible name of the navigation landmark." },
      ],
    },
    {
      kind: "Directives",
      target: "breadcrumb",
      props: [
        { name: "ngAtomsBreadcrumbList", type: "ol", defaultVal: "—", description: "The ordered list holding the trail." },
        { name: "ngAtomsBreadcrumbItem", type: "li", defaultVal: "—", description: "One level of the trail." },
        { name: "ngAtomsBreadcrumbLink", type: "a", defaultVal: "—", description: "Link to an ancestor page." },
        { name: "ngAtomsBreadcrumbPage", type: "span", defaultVal: "—", description: "The current page. Sets aria-current=\"page\"." },
        { name: "ngAtomsBreadcrumbSeparator", type: "li", defaultVal: "—", description: "Divider between levels. Renders \"/\" when empty." },
        { name: "ngAtomsBreadcrumbEllipsis", type: "span", defaultVal: "—", description: "Stands in for collapsed levels. Renders \"…\" when empty." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "signpost", title: "Landmark", body: "Use the directive on a <nav> element. It gets aria-label=\"Breadcrumb\", which you can change with the label input." },
    { icon: "map-pin", title: "Current page", body: "ngAtomsBreadcrumbPage sets aria-current=\"page\" so screen readers announce where the user is." },
    { icon: "eye-slash", title: "Separators", body: "Separators and the ellipsis are hidden from assistive technology, so only the levels are read." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "separator", label: "Custom separator" },
    { id: "collapsed", label: "Collapsed" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
