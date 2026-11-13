import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsFileUploadComponent,
  type NgAtomsFileRejection,
} from "../../../components/file-upload";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-file-upload-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsFileUploadComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./file-upload-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./file-upload-page.component.css",
})
export class FileUploadPageComponent {
  readonly heroFiles = signal<File[]>([]);
  readonly imageFiles = signal<File[]>([]);
  readonly customFiles = signal<File[]>([]);
  readonly rejectedMessage = signal("");

  onRejected(rejections: NgAtomsFileRejection[]): void {
    this.rejectedMessage.set(
      rejections.map((r) => `${r.file.name}: ${r.reason}`).join(", "),
    );
  }

  readonly heroCode = "<nga-file-upload [(files)]=\"files\" />";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsFileUploadComponent } from './ui/file-upload';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsFileUploadComponent],\n  template: `<nga-file-upload [(files)]=\"files\" />`,\n})\nexport class MyComponent {\n  readonly files = signal<File[]>([]);\n}";

  readonly codeValidation = "<nga-file-upload\n  [(files)]=\"images\"\n  [multiple]=\"true\"\n  accept=\"image/*\"\n  [maxSize]=\"2 * 1024 * 1024\"\n  [maxFiles]=\"3\"\n  (rejected)=\"onRejected($event)\"\n/>";

  readonly codeContent = "<nga-file-upload [(files)]=\"files\" accept=\".pdf\" label=\"Upload contract\">\n  <i class=\"ph ph-file-pdf\"></i>\n  <strong>Upload your contract</strong>\n  <span>PDF only, one file</span>\n</nga-file-upload>";

  readonly codeDisabled = "<nga-file-upload [disabled]=\"true\" />";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-file-upload",
      props: [
        { name: "files", type: "File[] (model)", defaultVal: "[]", description: "Two-way binding for the accepted files." },
        { name: "accept", type: "string", defaultVal: "''", description: "Allowed types, native syntax: \".pdf,image/*\"." },
        { name: "multiple", type: "boolean", defaultVal: "false", description: "Allows several files. Off, a new file replaces the current one." },
        { name: "maxSize", type: "number", defaultVal: "Infinity", description: "Maximum size per file, in bytes." },
        { name: "maxFiles", type: "number", defaultVal: "Infinity", description: "Maximum number of files when multiple is on." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents all interaction." },
        { name: "label", type: "string", defaultVal: "'Upload files'", description: "Accessible name of the file input." },
      ],
    },
    {
      kind: "Outputs",
      target: "nga-file-upload",
      props: [
        { name: "rejected", type: "NgAtomsFileRejection[]", defaultVal: "—", description: "Files that were not accepted, each with a reason: 'type', 'size', or 'count'." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "keyboard", title: "Keyboard", body: "The native input stays in the tab order. Enter or Space opens the file browser, and the zone shows the focus ring." },
    { icon: "tag", title: "Labels", body: "The input is named by the label input. Each remove button is labelled \"Remove <file name>\"." },
    { icon: "warning", title: "Rejections", body: "Rejected files are only emitted, not announced. Show the reason near the control, ideally in a live region." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "validation", label: "Multiple files and validation" },
    { id: "content", label: "Custom content" },
    { id: "disabled", label: "Disabled" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
