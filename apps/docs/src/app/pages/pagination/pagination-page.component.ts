import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsPaginationComponent,
} from "../../../components/pagination";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-pagination-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsPaginationComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./pagination-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./pagination-page.component.css",
})
export class PaginationPageComponent {
  readonly heroPage = signal(1);
  readonly siblingPage = signal(10);
  readonly sizePage = signal(2);

  readonly heroCode = "<nga-pagination [(page)]=\"page\" [total]=\"120\" [pageSize]=\"10\" />";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsPaginationComponent } from './ui/pagination';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsPaginationComponent],\n  template: `<nga-pagination [(page)]=\"page\" [total]=\"total\" [pageSize]=\"10\" />`,\n})\nexport class MyComponent {\n  readonly page = signal(1);\n  readonly total = 120;\n}";

  readonly codeSiblings = "<nga-pagination [(page)]=\"page\" [total]=\"200\" [siblingCount]=\"0\" />\n<nga-pagination [(page)]=\"page\" [total]=\"200\" [siblingCount]=\"1\" />\n<nga-pagination [(page)]=\"page\" [total]=\"200\" [siblingCount]=\"2\" />";

  readonly codeSizes = "<nga-pagination [(page)]=\"page\" [total]=\"50\" size=\"sm\" />\n<nga-pagination [(page)]=\"page\" [total]=\"50\" size=\"md\" />\n<nga-pagination [(page)]=\"page\" [total]=\"50\" size=\"lg\" />";

  readonly codeDisabled = "<nga-pagination [page]=\"3\" [total]=\"80\" [disabled]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-pagination",
      props: [
        { name: "page", type: "number (model)", defaultVal: "1", description: "Two-way binding for the current page, 1-based." },
        { name: "total", type: "number", defaultVal: "0", description: "Total number of items." },
        { name: "pageSize", type: "number", defaultVal: "10", description: "Items per page." },
        { name: "siblingCount", type: "number", defaultVal: "1", description: "Pages shown on each side of the current page." },
        { name: "size", type: "'sm' | 'md' | 'lg'", defaultVal: "'md'", description: "Size preset." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "label", type: "string", defaultVal: "'Pagination'", description: "Accessible name of the navigation landmark." },
        { name: "previousLabel", type: "string", defaultVal: "'Previous page'", description: "Accessible name of the previous button." },
        { name: "nextLabel", type: "string", defaultVal: "'Next page'", description: "Accessible name of the next button." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "signpost", title: "Landmark", body: "The host has role=\"navigation\" and an aria-label, so it can be reached from the landmarks list." },
    { icon: "map-pin", title: "Current page", body: "The active page button has aria-current=\"page\". Every page button is labelled \"Page N\"." },
    { icon: "keyboard", title: "Keyboard", body: "Tab moves between buttons; Enter or Space activates one. Previous and next are disabled at the ends." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "siblings", label: "Sibling count" },
    { id: "sizes", label: "Sizes" },
    { id: "disabled", label: "Disabled" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
