import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsTagInputComponent,
} from "../../../components/tag-input";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-tag-input-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsTagInputComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./tag-input-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./tag-input-page.component.css",
})
export class TagInputPageComponent {
  readonly heroTags = signal(["angular", "signals"]);
  readonly maxTags = signal(["one", "two"]);
  readonly sizeTags = signal(["design", "tokens"]);

  readonly heroCode = "<nga-tag-input [(tags)]=\"tags\" placeholder=\"Add a tag…\" label=\"Tags\" />";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsTagInputComponent } from './ui/tag-input';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsTagInputComponent],\n  template: `<nga-tag-input [(tags)]=\"tags\" placeholder=\"Add a tag…\" />`,\n})\nexport class MyComponent {\n  readonly tags = signal<string[]>(['angular', 'signals']);\n}";

  readonly codeMax = "<nga-tag-input [(tags)]=\"tags\" [max]=\"3\" placeholder=\"Up to 3 tags\" />";

  readonly codeSeparators = "<!-- Comma, semicolon, or space adds a tag -->\n<nga-tag-input [(tags)]=\"emails\" [separators]=\"[',', ';', ' ']\" />";

  readonly codeSizes = "<nga-tag-input [(tags)]=\"tags\" size=\"sm\" />\n<nga-tag-input [(tags)]=\"tags\" size=\"md\" />\n<nga-tag-input [(tags)]=\"tags\" size=\"lg\" />";

  readonly codeStates = "<nga-tag-input [tags]=\"tags\" [disabled]=\"true\" />\n<nga-tag-input [tags]=\"tags\" [invalid]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-tag-input",
      props: [
        { name: "tags", type: "string[] (model)", defaultVal: "[]", description: "Two-way binding for the list of tags." },
        { name: "placeholder", type: "string", defaultVal: "''", description: "Shown while there are no tags." },
        { name: "max", type: "number", defaultVal: "Infinity", description: "Maximum number of tags." },
        { name: "allowDuplicates", type: "boolean", defaultVal: "false", description: "Accepts a tag that already exists." },
        { name: "separators", type: "string[]", defaultVal: "[',']", description: "Characters that commit a tag, besides Enter." },
        { name: "size", type: "'sm' | 'md' | 'lg'", defaultVal: "'md'", description: "Size preset." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "invalid", type: "boolean", defaultVal: "false", description: "Applies error styling." },
        { name: "label", type: "string", defaultVal: "'Add tag'", description: "Accessible name of the text field." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "Enter or a separator adds the typed text. Backspace in an empty field removes the last tag. Tab reaches each remove button." },
    { icon: "tag", title: "Labels", body: "Set label, or wrap the component in a <label>, so the field is announced with a name. Remove buttons are labelled \"Remove <tag>\"." },
    { icon: "clipboard-text", title: "Paste", body: "Pasting a separated list adds every item at once." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "max", label: "Max and duplicates" },
    { id: "separators", label: "Separators and paste" },
    { id: "sizes", label: "Sizes" },
    { id: "states", label: "Disabled and invalid" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
