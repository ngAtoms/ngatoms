import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsComboboxComponent,
  type NgAtomsComboboxOption,
} from "../../../components/combobox";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-combobox-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsComboboxComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./combobox-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./combobox-page.component.css",
})
export class ComboboxPageComponent {
  readonly frameworks: NgAtomsComboboxOption[] = [
    { value: "angular", label: "Angular" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "svelte", label: "Svelte" },
    { value: "solid", label: "Solid" },
    { value: "qwik", label: "Qwik" },
    { value: "ember", label: "Ember", disabled: true },
  ];

  readonly heroVal = signal<string | null>(null);
  readonly sizeVal = signal<string | null>("angular");
  readonly prefixVal = signal<string | null>(null);

  readonly startsWith = (option: NgAtomsComboboxOption, query: string) =>
    option.label.toLowerCase().startsWith(query.trim().toLowerCase());

  readonly heroCode = "<nga-combobox\n  [options]=\"frameworks\"\n  [(value)]=\"framework\"\n  placeholder=\"Search a framework…\"\n  label=\"Framework\"\n/>";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsComboboxComponent, NgAtomsComboboxOption } from './ui/combobox';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsComboboxComponent],\n  template: `\n    <nga-combobox [options]=\"frameworks\" [(value)]=\"framework\" label=\"Framework\" />\n  `,\n})\nexport class MyComponent {\n  readonly framework = signal<string | null>(null);\n\n  readonly frameworks: NgAtomsComboboxOption[] = [\n    { value: 'angular', label: 'Angular' },\n    { value: 'react', label: 'React' },\n    { value: 'ember', label: 'Ember', disabled: true },\n  ];\n}";

  readonly codeSizes = "<nga-combobox [options]=\"options\" [(value)]=\"value\" size=\"sm\" />\n<nga-combobox [options]=\"options\" [(value)]=\"value\" size=\"md\" />\n<nga-combobox [options]=\"options\" [(value)]=\"value\" size=\"lg\" />";

  readonly codeFilter = "<nga-combobox\n  [options]=\"frameworks\"\n  [(value)]=\"framework\"\n  [filter]=\"startsWith\"\n  emptyText=\"Nothing starts with that\"\n/>\n\n// in the component class\nreadonly startsWith = (option: NgAtomsComboboxOption, query: string) =>\n  option.label.toLowerCase().startsWith(query.trim().toLowerCase());";

  readonly codeStates = "<nga-combobox [options]=\"options\" value=\"react\" [disabled]=\"true\" />\n<nga-combobox [options]=\"options\" [invalid]=\"true\" placeholder=\"Required\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-combobox",
      props: [
        { name: "options", type: "NgAtomsComboboxOption[]", defaultVal: "[]", description: "Options to choose from." },
        { name: "value", type: "string | null (model)", defaultVal: "null", description: "Two-way binding for the selected option value." },
        { name: "open", type: "boolean (model)", defaultVal: "false", description: "Two-way binding for the panel state." },
        { name: "placeholder", type: "string", defaultVal: "''", description: "Shown while nothing is selected." },
        { name: "size", type: "'sm' | 'md' | 'lg'", defaultVal: "'md'", description: "Size preset." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "invalid", type: "boolean", defaultVal: "false", description: "Applies error styling." },
        { name: "emptyText", type: "string", defaultVal: "'No results'", description: "Shown when no option matches." },
        { name: "filter", type: "(option, query) => boolean", defaultVal: "label contains query", description: "Custom matcher." },
        { name: "label", type: "string", defaultVal: "''", description: "Accessible name. Omit it when a <label> names the field." },
      ],
    },
    {
      kind: "Fields",
      target: "NgAtomsComboboxOption",
      props: [
        { name: "value", type: "string", defaultVal: "required", description: "Unique value stored in the model." },
        { name: "label", type: "string", defaultVal: "required", description: "Text shown and matched against." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Shows the option but prevents picking it." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "Arrow Down/Up open the list and move through it, skipping disabled options. Enter picks the active option, Escape closes, Tab closes and moves on." },
    { icon: "list", title: "ARIA", body: "The input has role=\"combobox\" with aria-expanded, aria-controls, and aria-activedescendant. Options have role=\"option\" and aria-selected." },
    { icon: "cursor-text", title: "Focus stays in the field", body: "Focus never leaves the input, so typing keeps working while the list is open." },
    { icon: "backspace", title: "Clearing", body: "Emptying the field clears the selection. Leaving the field with unmatched text restores the selected label." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "sizes", label: "Sizes" },
    { id: "filter", label: "Custom filter" },
    { id: "states", label: "Disabled and invalid" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
