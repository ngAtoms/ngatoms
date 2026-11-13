import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsRatingComponent,
} from "../../../components/rating";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-rating-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsRatingComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./rating-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./rating-page.component.css",
})
export class RatingPageComponent {
  readonly heroVal = signal(3);
  readonly sizeVal = signal(4);
  readonly tenVal = signal(7);

  readonly heroCode = "<nga-rating [(value)]=\"rating\" />";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsRatingComponent } from './ui/rating';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsRatingComponent],\n  template: `<nga-rating [(value)]=\"rating\" />`,\n})\nexport class MyComponent {\n  readonly rating = signal(3);\n}";

  readonly codeSizes = "<nga-rating [(value)]=\"rating\" size=\"sm\" />\n<nga-rating [(value)]=\"rating\" size=\"md\" />\n<nga-rating [(value)]=\"rating\" size=\"lg\" />";

  readonly codeMax = "<nga-rating [(value)]=\"rating\" [max]=\"10\" />";

  readonly codeReadonly = "<nga-rating [value]=\"4\" [readonly]=\"true\" />\n<nga-rating [value]=\"2\" [disabled]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-rating",
      props: [
        { name: "value", type: "number (model)", defaultVal: "0", description: "Two-way binding for the rating. 0 means no rating." },
        { name: "max", type: "number", defaultVal: "5", description: "Number of stars." },
        { name: "size", type: "'sm' | 'md' | 'lg'", defaultVal: "'md'", description: "Size preset." },
        { name: "readonly", type: "boolean", defaultVal: "false", description: "Shows the value without accepting input." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "clearable", type: "boolean", defaultVal: "true", description: "Clicking the current value resets the rating to 0." },
        { name: "label", type: "string", defaultVal: "'Rating'", description: "Accessible name of the group." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "Arrow Right/Up raises the rating and Arrow Left/Down lowers it. Home selects one star and End selects the maximum." },
    { icon: "list", title: "ARIA roles", body: "The host has role=\"radiogroup\" and each star has role=\"radio\" with aria-checked and a label such as \"3 stars\"." },
    { icon: "eye", title: "Read-only", body: "In readonly mode the host becomes role=\"img\" with a label like \"Rating: 4 of 5\", and the stars leave the tab order." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "sizes", label: "Sizes" },
    { id: "max", label: "Max" },
    { id: "readonly", label: "Read-only and disabled" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
