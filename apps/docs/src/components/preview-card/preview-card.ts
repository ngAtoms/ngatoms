import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

@Component({
  selector: "preview-card",
  templateUrl: "./preview-card.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./preview-card.css",
})
export class PreviewCard {
  tab = signal<string>("preview");
  allowOverflow = input(false);
  previewMinHeight = input("320px");
  readonly disabledCode = `<button ngAtomsButton [disabled]="true">Disabled</button>`;

  setTab(tab: "preview" | "code") {
    this.tab.set(tab);
  }
}
