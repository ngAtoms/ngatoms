import {Component, input, signal} from "@angular/core";
import {CodeBlockComponent} from "../code-block/code-block.component";
import {NgAtomsButtonDirective} from "../button";

@Component({
  selector: "preview-card",
    imports: [


    ],
  templateUrl: "./preview-card.html",
  styleUrl: "./preview-card.css",
})
export class PreviewCard {
    tab = signal<string>('preview')
    allowOverflow = input(false)
    previewMinHeight = input('320px')
    readonly disabledCode = `<button ngAtomsButton [disabled]="true">Disabled</button>`

    setTab(tab: 'preview' | 'code') {
       this.tab.set(tab)
    }
}
