import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsStepperComponent,
  NgAtomsStepComponent,
} from "../../../components/stepper";
import {
  NgAtomsButtonDirective,
} from "../../../components/button";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";
import { PropsTableComponent } from "../../../components/props-table/props-table.component";
import { type DocsShortcut, ShortcutsTableComponent } from "../../../components/shortcuts-table/shortcuts-table.component";

@Component({
  selector: "app-stepper-page",
  standalone: true,
  imports: [ShortcutsTableComponent, PropsTableComponent, 
    RouterLink,
    NgAtomsStepperComponent,
    NgAtomsStepComponent,
    NgAtomsButtonDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./stepper-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./stepper-page.component.css",
})
export class StepperPageComponent {
  readonly shortcuts: DocsShortcut[] = [
    { action: "Move between steps", windows: "Tab / Shift+Tab", mac: "Tab / ⇧Tab" },
    { action: "Activate a step", windows: "Enter or Space", mac: "Return or Space" },
  ];

  readonly heroStep = signal(1);
  readonly clickStep = signal(2);

  back(): void {
    this.heroStep.update((s) => Math.max(0, s - 1));
  }

  next(): void {
    this.heroStep.update((s) => Math.min(3, s + 1));
  }

  readonly heroCode = "<nga-stepper [(activeStep)]=\"step\">\n  <nga-step label=\"Account\" />\n  <nga-step label=\"Profile\" />\n  <nga-step label=\"Billing\" />\n  <nga-step label=\"Review\" />\n</nga-stepper>\n\n<button ngAtomsButton variant=\"outline\" (click)=\"step.set(step() - 1)\">Back</button>\n<button ngAtomsButton (click)=\"step.set(step() + 1)\">Next</button>";

  readonly usageCode = "import { Component, signal } from '@angular/core';\nimport { NgAtomsStepperComponent, NgAtomsStepComponent } from './ui/stepper';\n\n@Component({\n  standalone: true,\n  imports: [NgAtomsStepperComponent, NgAtomsStepComponent],\n  template: `\n    <nga-stepper [(activeStep)]=\"step\">\n      <nga-step label=\"Account\" />\n      <nga-step label=\"Profile\" />\n      <nga-step label=\"Review\" />\n    </nga-stepper>\n  `,\n})\nexport class MyComponent {\n  readonly step = signal(0);\n}";

  readonly codeVertical = "<nga-stepper [activeStep]=\"1\" orientation=\"vertical\">\n  <nga-step label=\"Create repository\" description=\"Name it and pick a visibility.\" />\n  <nga-step label=\"Add collaborators\" description=\"Invite your team.\" />\n  <nga-step label=\"Deploy\" description=\"Ship the first version.\" />\n</nga-stepper>";

  readonly codeClickable = "<nga-stepper [(activeStep)]=\"step\" [clickable]=\"true\">\n  <nga-step label=\"Cart\" />\n  <nga-step label=\"Shipping\" />\n  <nga-step label=\"Payment\" />\n  <nga-step label=\"Done\" [disabled]=\"true\" />\n</nga-stepper>";

  readonly codeError = "<nga-stepper [activeStep]=\"2\">\n  <nga-step label=\"Details\" />\n  <nga-step label=\"Address\" [error]=\"true\" />\n  <nga-step label=\"Confirm\" />\n</nga-stepper>";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "nga-stepper",
      props: [
        { name: "activeStep", type: "number (model)", defaultVal: "0", description: "Two-way binding for the current step, 0-based." },
        { name: "orientation", type: "'horizontal' | 'vertical'", defaultVal: "'horizontal'", description: "Layout direction." },
        { name: "clickable", type: "boolean", defaultVal: "false", description: "Lets the user jump to a step by clicking it." },
        { name: "label", type: "string", defaultVal: "'Progress'", description: "Accessible name of the list." },
      ],
    },
    {
      kind: "Inputs",
      target: "nga-step",
      props: [
        { name: "label", type: "string", defaultVal: "required", description: "Step title." },
        { name: "description", type: "string", defaultVal: "''", description: "Optional second line." },
        { name: "error", type: "boolean", defaultVal: "false", description: "Marks the step as failed." },
        { name: "disabled", type: "boolean", defaultVal: "false", description: "Prevents the step from being activated." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "list-numbers", title: "List semantics", body: "The stepper has role=\"list\" and each step role=\"listitem\", so the number of steps and each position are announced." },
    { icon: "map-pin", title: "Current step", body: "The active step has aria-current=\"step\". Each step also carries hidden text: completed, current, not started, or error." },
    { icon: "keyboard", title: "Keyboard", body: "When clickable, steps are native buttons: Tab moves between them and Enter or Space activates one." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "vertical", label: "Vertical" },
    { id: "clickable", label: "Clickable steps" },
    { id: "error", label: "Error" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
