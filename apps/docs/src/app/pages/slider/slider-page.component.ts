import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsSliderComponent,
} from "../../../components/slider";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";
import { PropsTableComponent } from "../../../components/props-table/props-table.component";
import { type DocsShortcut, ShortcutsTableComponent } from "../../../components/shortcuts-table/shortcuts-table.component";

@Component({
  selector: "app-slider-page",
  standalone: true,
  imports: [ShortcutsTableComponent, PropsTableComponent, 
    RouterLink,
    NgAtomsSliderComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./slider-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./slider-page.component.css",
})
export class SliderPageComponent {
  readonly shortcuts: DocsShortcut[] = [
    { action: "Move one step", windows: "Arrow keys" },
    { action: "Move a tenth of the range", windows: "Page Up / Page Down", mac: "Fn+↑ / Fn+↓" },
    { action: "Jump to the bounds", windows: "Home / End", mac: "Fn+← / Fn+→" },
  ];

  readonly heroVal = signal(40);
  readonly rangeVal = signal<[number, number]>([20, 70]);
  readonly stepVal = signal(2.5);
  readonly sizeVal = signal(60);

  readonly heroCode = "<nga-slider [(value)]=\"volume\" label=\"Volume\" />";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsSliderComponent } from './ui/slider';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsSliderComponent],\n  template: `<nga-slider [(value)]=\"volume\" label=\"Volume\" />`,\n})\nexport class MyComponent {\n  readonly volume = signal(40);\n}";

  readonly codeRange = "<nga-slider\n  mode=\"range\"\n  [(range)]=\"price\"\n  [rangeLabels]=\"['Minimum price', 'Maximum price']\"\n/>";

  readonly codeStep = "<nga-slider [(value)]=\"rating\" [min]=\"0\" [max]=\"5\" [step]=\"0.5\" />";

  readonly codeSizes = "<nga-slider [(value)]=\"value\" size=\"sm\" />\n<nga-slider [(value)]=\"value\" size=\"md\" />\n<nga-slider [(value)]=\"value\" size=\"lg\" />";

  readonly codeDisabled = "<nga-slider [value]=\"30\" [disabled]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-slider",
      props: [
        { name: "mode", type: "'single' | 'range'", defaultVal: "'single'", description: "One thumb or two." },
        { name: "value", type: "number (model)", defaultVal: "0", description: "Two-way binding for single mode." },
        { name: "range", type: "[number, number] (model)", defaultVal: "[0, 100]", description: "Two-way binding for range mode." },
        { name: "min", type: "number", defaultVal: "0", description: "Lower bound." },
        { name: "max", type: "number", defaultVal: "100", description: "Upper bound." },
        { name: "step", type: "number", defaultVal: "1", description: "Snap increment." },
        { name: "size", type: "'sm' | 'md' | 'lg'", defaultVal: "'md'", description: "Size preset." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "label", type: "string", defaultVal: "'Value'", description: "Accessible name of the single thumb." },
        { name: "rangeLabels", type: "[string, string]", defaultVal: "['Minimum', 'Maximum']", description: "Accessible names of the range thumbs." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "Arrow keys move by one step, Page Up/Down by a tenth of the range, and Home/End jump to the bounds." },
    { icon: "list", title: "ARIA", body: "Each thumb has role=\"slider\" with aria-valuemin, aria-valuemax, aria-valuenow, and its own label. In range mode each thumb is bounded by the other." },
    { icon: "hand-pointing", title: "Pointer", body: "Click or drag anywhere on the track. The closest thumb is grabbed, and touch dragging does not scroll the page." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "range", label: "Range" },
    { id: "step", label: "Min, max, and step" },
    { id: "sizes", label: "Sizes" },
    { id: "disabled", label: "Disabled" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
