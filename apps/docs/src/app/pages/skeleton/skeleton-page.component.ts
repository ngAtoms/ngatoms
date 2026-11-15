import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsSkeletonDirective,
} from "../../../components/skeleton";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";
import { PropsTableComponent } from "../../../components/props-table/props-table.component";

@Component({
  selector: "app-skeleton-page",
  standalone: true,
  imports: [PropsTableComponent, 
    RouterLink,
    NgAtomsSkeletonDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./skeleton-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./skeleton-page.component.css",
})
export class SkeletonPageComponent {
  readonly heroCode = "<div class=\"card\">\n  <span ngAtomsSkeleton variant=\"circle\"></span>\n  <div class=\"lines\">\n    <span ngAtomsSkeleton style=\"width: 55%\"></span>\n    <span ngAtomsSkeleton style=\"width: 90%\"></span>\n  </div>\n</div>";

  readonly usageCode = "import { Component } from '@angular/core';\nimport { NgAtomsSkeletonDirective } from './ui/skeleton';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsSkeletonDirective],\n  template: `<span ngAtomsSkeleton></span>`,\n})\nexport class MyComponent {}";

  readonly codeVariants = "<span ngAtomsSkeleton variant=\"text\"></span>\n<span ngAtomsSkeleton variant=\"circle\"></span>\n<span ngAtomsSkeleton variant=\"rect\"></span>";

  readonly codeSizing = "<span ngAtomsSkeleton variant=\"circle\" style=\"width: 64px; height: 64px\"></span>\n<span ngAtomsSkeleton variant=\"rect\" style=\"width: 160px; height: 64px\"></span>";

  readonly codeStatic = "<span ngAtomsSkeleton [animated]=\"false\"></span>";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "[ngAtomsSkeleton]",
      props: [
        { name: "variant", type: "'text' | 'circle' | 'rect'", defaultVal: "'text'", description: "Shape of the placeholder." },
        { name: "animated", type: "boolean", defaultVal: "true", description: "Plays the shimmer animation." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "eye-slash", title: "Hidden from screen readers", body: "Each skeleton sets aria-hidden=\"true\". Announce the loading state yourself, for example with aria-busy=\"true\" on the region being loaded." },
    { icon: "wind", title: "Reduced motion", body: "The shimmer stops under prefers-reduced-motion: reduce." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "variants", label: "Variants" },
    { id: "sizing", label: "Sizing" },
    { id: "static", label: "Static" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
