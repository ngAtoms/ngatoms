import { Component, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsPopoverComponent, NgAtomsPopoverTriggerDirective } from '../../../components/popover';
import { NgAtomsButtonDirective } from '../../../components/button';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import {TocComponent} from "../../../components/toc/toc.component";

@Component({
    selector: 'app-popover-page',
    standalone: true,
    imports: [
        RouterLink,
        NgAtomsPopoverComponent,
        NgAtomsPopoverTriggerDirective,
        NgAtomsButtonDirective,
        CodeBlockComponent,
        TocComponent,
    ],
    templateUrl: './popover-page.component.html',
    styleUrl: './popover-page.component.css',
})
export class PopoverPageComponent {
    previewTabs: Record<string, 'preview' | 'code'> = {};

    open = model(false);
    openTop = model(false);
    openRight = model(false);
    openLeft = model(false);


    tab(id: string): 'preview' | 'code' {
        return this.previewTabs[id] ?? 'preview';
    }

    setTab(id: string, tab: 'preview' | 'code') {
        this.previewTabs = {...this.previewTabs, [id]: tab};
    }

    readonly tocItems = [
        {id: 'usage', label: 'Usage'},
        {id: 'placements', label: 'Placements'},
        {id: 'install', label: 'Installation'},
        {id: 'props', label: 'Props'},
        {id: 'a11y', label: 'Accessibility'},
    ];

    readonly basicCode = `<nga-popover [(open)]="open" placement="bottom">
  <button ngAtomsButton ngAtomsPopoverTrigger variant="outline">
    More info
  </button>
  <p>This is the popover content. It can contain any HTML.</p>
</nga-popover>`;

    readonly placementCode = `<nga-popover [(open)]="open" placement="top">...</nga-popover>
<nga-popover [(open)]="open" placement="right">...</nga-popover>
<nga-popover [(open)]="open" placement="left">...</nga-popover>
<nga-popover [(open)]="open" placement="bottom">...</nga-popover>`;

    readonly installCode = `ngatoms add popover`;

    readonly importCode = `import { NgAtomsPopoverComponent, NgAtomsPopoverTriggerDirective } from './components/popover';

@Component({
  imports: [NgAtomsPopoverComponent, NgAtomsPopoverTriggerDirective],
})
export class ExampleComponent {
  open = signal(false);
}`;

    readonly props = [
        {name: 'open', type: 'boolean', default: 'false', desc: 'Two-way binding — controls open/closed state.'},
        {
            name: 'placement',
            type: `'bottom' | 'top' | 'left' | 'right'`,
            default: `'bottom'`,
            desc: 'Which side the panel opens relative to the trigger.'
        },
    ];

    readonly a11yItems = [
        {
            icon: 'ph-keyboard',
            title: 'Keyboard support',
            desc: 'Escape closes the popover and returns focus to the trigger.'
        },
        {icon: 'ph-cursor-click', title: 'Click outside', desc: 'Clicking outside the panel closes it automatically.'},
        {icon: 'ph-arrow-u-up-left', title: 'Focus management', desc: 'Focus is trapped inside the panel while open.'},
        {icon: 'ph-list', title: 'ARIA', desc: 'Trigger has aria-expanded. Panel has role="dialog" with aria-modal.'},
    ];

}
