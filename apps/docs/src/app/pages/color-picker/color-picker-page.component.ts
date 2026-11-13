import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsColorPickerComponent,
} from "../../../components/color-picker";
import {
  NgAtomsPopoverComponent,
  NgAtomsPopoverTriggerDirective,
} from "../../../components/popover";
import {
  NgAtomsButtonDirective,
} from "../../../components/button";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-color-picker-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsColorPickerComponent,
    NgAtomsPopoverComponent,
    NgAtomsPopoverTriggerDirective,
    NgAtomsButtonDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./color-picker-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./color-picker-page.component.css",
})
export class ColorPickerPageComponent {
  readonly heroVal = signal("#3b82f6");
  readonly swatchVal = signal("#10b981");
  readonly popoverVal = signal("#f59e0b");

  readonly palette = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#1a1a1a", "#f7f8fa"];

  readonly heroCode = "<nga-color-picker [(value)]=\"color\" />";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsColorPickerComponent } from './ui/color-picker';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsColorPickerComponent],\n  template: `<nga-color-picker [(value)]=\"color\" />`,\n})\nexport class MyComponent {\n  readonly color = signal('#3b82f6');\n}";

  readonly codeSwatches = "<nga-color-picker [(value)]=\"color\" [swatches]=\"palette\" />\n\n// in the component class\nreadonly palette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];";

  readonly codePopover = "<nga-popover>\n  <button ngAtomsButton ngAtomsPopoverTrigger variant=\"outline\">\n    <span class=\"swatch\" [style.background-color]=\"color()\"></span>\n    {{ color() }}\n  </button>\n  <nga-color-picker [(value)]=\"color\" [swatches]=\"palette\" />\n</nga-popover>";

  readonly codeDisabled = "<nga-color-picker value=\"#8b5cf6\" [disabled]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-color-picker",
      props: [
        { name: "value", type: "string (model)", defaultVal: "'#333333'", description: "Two-way binding for the color, as a 6-digit hex string." },
        { name: "swatches", type: "string[]", defaultVal: "[]", description: "Preset hex colors shown as buttons." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "label", type: "string", defaultVal: "'Color picker'", description: "Accessible name of the group." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "On the color area, arrow keys change saturation (left/right) and brightness (up/down). On the hue slider they change the hue. Hold Shift for larger steps." },
    { icon: "list", title: "ARIA", body: "Both thumbs have role=\"slider\" with a label and aria-valuetext describing the current values. Swatches are buttons with aria-pressed." },
    { icon: "hash", title: "Hex field", body: "Type or paste a 3- or 6-digit hex value and press Enter. Invalid input is discarded and the previous color restored." },
    { icon: "eye", title: "Not color alone", body: "The hex value is always shown as text next to the preview, so the choice does not rely on color perception." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "swatches", label: "Swatches" },
    { id: "popover", label: "Inside a popover" },
    { id: "disabled", label: "Disabled" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
