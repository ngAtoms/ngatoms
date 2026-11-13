import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsCodeBlockComponent,
  type NgAtomsCodeHighlighter,
} from "../../../components/nga-code-block";
import hljs from "highlight.js/lib/core";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-code-block-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsCodeBlockComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./code-block-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./code-block-page.component.css",
})
export class CodeBlockPageComponent {
  readonly sample = "import { Component, signal } from '@angular/core';\n\n@Component({\n  selector: 'app-counter',\n  template: `<button (click)=\"count.set(count() + 1)\">{{ count() }}</button>`,\n})\nexport class CounterComponent {\n  readonly count = signal(0);\n}";

  readonly shell = "npx ngatoms add code-block";

  // The docs app already depends on highlight.js; the component itself does not.
  readonly highlight: NgAtomsCodeHighlighter = (code, language) =>
    hljs.highlight(code, { language }).value;

  readonly heroCode = "<nga-code-block [code]=\"source\" language=\"typescript\" filename=\"counter.component.ts\" />";

  readonly usageCode = "import { Component } from '@angular/core';\nimport { NgAtomsCodeBlockComponent } from './ui/code-block';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsCodeBlockComponent],\n  template: `<nga-code-block [code]=\"source\" language=\"typescript\" />`,\n})\nexport class MyComponent {\n  readonly source = `const answer = 42;`;\n}";

  readonly codeHighlighting = "import hljs from 'highlight.js/lib/core';\nimport typescript from 'highlight.js/lib/languages/typescript';\nimport { NgAtomsCodeHighlighter } from './ui/code-block';\n\nhljs.registerLanguage('typescript', typescript);\n\n// in the component class\nreadonly highlight: NgAtomsCodeHighlighter = (code, language) =>\n  hljs.highlight(code, { language }).value;\n\n// in the template\n// <nga-code-block [code]=\"source\" language=\"typescript\" [highlighter]=\"highlight\" />";

  readonly codeLines = "<nga-code-block [code]=\"source\" language=\"typescript\" [lineNumbers]=\"true\" />";

  readonly codeBare = "<nga-code-block [code]=\"command\" [copyable]=\"false\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-code-block",
      props: [
        { name: "code", type: "string", defaultVal: "required", description: "Source code to display. Leading blank lines and trailing whitespace are trimmed." },
        { name: "language", type: "string", defaultVal: "''", description: "Language id. Shown in the header and passed to the highlighter." },
        { name: "filename", type: "string", defaultVal: "''", description: "Shown in the header instead of the language." },
        { name: "lineNumbers", type: "boolean", defaultVal: "false", description: "Shows a line-number gutter." },
        { name: "copyable", type: "boolean", defaultVal: "true", description: "Shows the copy button." },
        { name: "highlighter", type: "(code, language) => string", defaultVal: "null", description: "Returns highlighted HTML. Without it the code renders as plain text." },
        { name: "copyLabel", type: "string", defaultVal: "'Copy code'", description: "Accessible name of the copy button." },
        { name: "copiedLabel", type: "string", defaultVal: "'Copied'", description: "Announced, and used as the button name, after copying." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Scrollable region", body: "The code area is focusable, so long lines can be scrolled horizontally with the arrow keys." },
    { icon: "megaphone", title: "Copy feedback", body: "After copying, the button name changes and a polite status message announces it. Both reset after two seconds." },
    { icon: "eye-slash", title: "Line numbers", body: "The gutter is hidden from assistive technology and excluded from text selection." },
    { icon: "shield-check", title: "Sanitized HTML", body: "Highlighter output goes through Angular's sanitizer: class names survive, inline styles and scripts are removed." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "highlighting", label: "Syntax highlighting" },
    { id: "lines", label: "Line numbers" },
    { id: "bare", label: "Without header" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
