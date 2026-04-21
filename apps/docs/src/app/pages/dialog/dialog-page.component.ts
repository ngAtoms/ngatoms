import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsDialogComponent } from '../../../components/dialog/dialog.component';
import { NgAtomsDialogHeaderDirective } from '../../../components/dialog/dialog-header.directive';
import { NgAtomsDialogTitleDirective } from '../../../components/dialog/dialog-title.directive';
import { NgAtomsDialogDescriptionDirective } from '../../../components/dialog/dialog-description.directive';
import { NgAtomsDialogBodyDirective } from '../../../components/dialog/dialog-body.directive';
import { NgAtomsDialogFooterDirective } from '../../../components/dialog/dialog-footer.directive';
import { NgAtomsDialogCloseDirective } from '../../../components/dialog/dialog-close.directive';
import { NgAtomsButtonDirective } from '../../../components/button';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import {TocComponent} from "../../../components/toc/toc.component";

@Component({
  selector: 'app-dialog-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsDialogComponent,
    NgAtomsDialogHeaderDirective,
    NgAtomsDialogTitleDirective,
    NgAtomsDialogDescriptionDirective,
    NgAtomsDialogBodyDirective,
    NgAtomsDialogFooterDirective,
    NgAtomsDialogCloseDirective,
    NgAtomsButtonDirective,
    CodeBlockComponent,
    TocComponent,
  ],
  templateUrl: './dialog-page.component.html',
  styleUrl: './dialog-page.component.css',
})
export class DialogPageComponent {
  previewTabs: Record<string, 'preview' | 'code'> = {};

  readonly editOpen    = signal(false);
  readonly confirmOpen = signal(false);
  readonly largeOpen   = signal(false);

  tab(id: string): 'preview' | 'code' { return this.previewTabs[id] ?? 'preview'; }
  setTab(id: string, tab: 'preview' | 'code') { this.previewTabs = { ...this.previewTabs, [id]: tab }; }

  readonly tocItems = [
    { id: 'usage',   label: 'Usage' },
    { id: 'sizes',   label: 'Sizes' },
    { id: 'confirm', label: 'Confirm pattern' },
    { id: 'install', label: 'Installation' },
    { id: 'props',   label: 'Props' },
    { id: 'a11y',    label: 'Accessibility' },
  ];

  readonly basicCode = `<button ngAtomsButton (click)="isOpen.set(true)">Open dialog</button>

<nga-dialog [(open)]="isOpen">
  <div ngAtomsDialogHeader>
    <div>
      <h2 ngAtomsDialogTitle>Edit profile</h2>
      <p ngAtomsDialogDescription>Update your display name.</p>
    </div>
    <button ngAtomsDialogClose>✕</button>
  </div>
  <div ngAtomsDialogBody>
    <!-- content -->
  </div>
  <div ngAtomsDialogFooter>
    <button ngAtomsButton variant="outline" (click)="isOpen.set(false)">Cancel</button>
    <button ngAtomsButton (click)="isOpen.set(false)">Save</button>
  </div>
</nga-dialog>`;

  readonly sizesCode = `<nga-dialog [(open)]="isOpen" size="sm">...</nga-dialog>
<nga-dialog [(open)]="isOpen" size="md">...</nga-dialog>  <!-- default -->
<nga-dialog [(open)]="isOpen" size="lg">...</nga-dialog>
<nga-dialog [(open)]="isOpen" size="xl">...</nga-dialog>`;

  readonly confirmCode = `<nga-dialog [(open)]="confirmOpen">
  <div ngAtomsDialogHeader>
    <div>
      <h2 ngAtomsDialogTitle>Delete item?</h2>
      <p ngAtomsDialogDescription>This action cannot be undone.</p>
    </div>
  </div>
  <div ngAtomsDialogFooter>
    <button ngAtomsButton variant="outline" (click)="confirmOpen.set(false)">Cancel</button>
    <button ngAtomsButton variant="destructive" (click)="onDelete()">Delete</button>
  </div>
</nga-dialog>`;

  readonly installCode = `ngatoms add dialog`;

  readonly importCode = `import { NgAtomsDialogComponent } from './components/dialog/dialog.component';
import { NgAtomsDialogHeaderDirective } from './components/dialog/dialog-header.directive';
import { NgAtomsDialogTitleDirective } from './components/dialog/dialog-title.directive';
import { NgAtomsDialogBodyDirective } from './components/dialog/dialog-body.directive';
import { NgAtomsDialogFooterDirective } from './components/dialog/dialog-footer.directive';
import { NgAtomsDialogCloseDirective } from './components/dialog/dialog-close.directive';`;

  readonly props = [
    { name: 'open',  type: 'boolean',                      default: 'false', desc: 'Two-way binding — controls the open/closed state.' },
    { name: 'size',  type: `'sm' | 'md' | 'lg' | 'xl'`,   default: `'md'`,  desc: 'Controls the max-width of the dialog panel.' },
  ];

  readonly a11yItems = [
    { icon: 'ph-lock-key',        title: 'Focus trap',        desc: 'Focus is trapped inside the dialog while open. Uses the native <dialog> element.' },
    { icon: 'ph-keyboard',        title: 'Escape key',        desc: 'Pressing Escape closes the dialog and returns focus to the trigger.' },
    { icon: 'ph-circles-three',   title: 'Backdrop blur',     desc: 'The backdrop uses blur() to visually separate the dialog from the page.' },
    { icon: 'ph-list',            title: 'ARIA roles',        desc: 'Uses native <dialog> with role="dialog" and aria-modal="true" automatically.' },
  ];

}
