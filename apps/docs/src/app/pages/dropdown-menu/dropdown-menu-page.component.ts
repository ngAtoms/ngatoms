import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NgAtomsDropdownMenuComponent,
  NgAtomsDropdownTriggerDirective,
  NgAtomsDropdownItemDirective,
  NgAtomsDropdownSeparatorDirective,
  NgAtomsDropdownLabelDirective,
} from '../../../components/dropdown-menu';
import { NgAtomsButtonDirective } from '../../../components/button';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import {TocComponent} from "../../../components/toc/toc.component";

@Component({
  selector: 'app-dropdown-menu-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsDropdownMenuComponent,
    NgAtomsDropdownTriggerDirective,
    NgAtomsDropdownItemDirective,
    NgAtomsDropdownSeparatorDirective,
    NgAtomsDropdownLabelDirective,
    NgAtomsButtonDirective,
    CodeBlockComponent,
    TocComponent,
  ],
  templateUrl: './dropdown-menu-page.component.html',
  styleUrl: './dropdown-menu-page.component.css',
})
export class DropdownMenuPageComponent {
  previewTabs: Record<string, 'preview' | 'code'> = {};

  tab(id: string): 'preview' | 'code' { return this.previewTabs[id] ?? 'preview'; }
  setTab(id: string, tab: 'preview' | 'code') { this.previewTabs = { ...this.previewTabs, [id]: tab }; }

  readonly tocItems = [
    { id: 'usage',       label: 'Usage' },
    { id: 'placements',  label: 'Placements' },
    { id: 'destructive', label: 'Destructive item' },
    { id: 'install',     label: 'Installation' },
    { id: 'props',       label: 'Props' },
    { id: 'a11y',        label: 'Accessibility' },
  ];

  readonly basicCode = `<nga-dropdown-menu>
  <button ngAtomsDropdownTrigger>
    Options <i class="ph-bold ph-caret-down nga-dropdown-caret"></i>
  </button>
  <span ngAtomsDropdownLabel>Actions</span>
  <button ngAtomsDropdownItem>
    <i class="ph-bold ph-pencil-simple"></i> Edit
  </button>
  <button ngAtomsDropdownItem>
    <i class="ph-bold ph-copy"></i> Duplicate
  </button>
  <div ngAtomsDropdownSeparator></div>
  <button ngAtomsDropdownItem [destructive]="true">
    <i class="ph-bold ph-trash"></i> Delete
  </button>
</nga-dropdown-menu>`;

  readonly placementCode = `<nga-dropdown-menu placement="top">
  <button ngAtomsDropdownTrigger>Opens above</button>
  <button ngAtomsDropdownItem>Item</button>
</nga-dropdown-menu>

<nga-dropdown-menu placement="right">
  <button ngAtomsDropdownTrigger>Opens right</button>
  <button ngAtomsDropdownItem>Item</button>
</nga-dropdown-menu>`;

  readonly destructiveCode = `<button ngAtomsDropdownItem [destructive]="true">
  <i class="ph-bold ph-trash"></i> Delete
</button>`;

  readonly installCode = `ngatoms add dropdown-menu`;

  readonly importCode = `import {
  NgAtomsDropdownMenuComponent,
  NgAtomsDropdownTriggerDirective,
  NgAtomsDropdownItemDirective,
  NgAtomsDropdownSeparatorDirective,
  NgAtomsDropdownLabelDirective,
} from './components/dropdown-menu';`;

  readonly props = [
    { name: 'placement',  type: `'bottom' | 'top' | 'left' | 'right'`, default: `'bottom'`, desc: 'Where the panel opens relative to the trigger.' },
    { name: 'disabled',   type: 'boolean',  default: 'false',   desc: 'Prevents the menu from opening.' },
    { name: 'destructive', type: 'boolean', default: 'false',   desc: 'On ngAtomsDropdownItem — renders in destructive (red) color.' },
  ];

  readonly a11yItems = [
    { icon: 'ph-keyboard',      title: 'Keyboard navigation', desc: 'Arrow keys move focus between items. Enter/Space activates. Escape closes.' },
    { icon: 'ph-arrows-out-simple', title: 'Repositioning',      desc: 'Stays open and follows its trigger when the page is scrolled.' },
    { icon: 'ph-list',          title: 'ARIA roles',           desc: 'Panel has role="menu", items have role="menuitem". Trigger has aria-haspopup and aria-expanded.' },
    { icon: 'ph-cursor-click',  title: 'Click outside',        desc: 'Clicking outside the panel closes the menu automatically.' },
  ];

}
