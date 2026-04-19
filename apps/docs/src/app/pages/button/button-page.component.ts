import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsButtonDirective } from '../../../components/button';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import {TocComponent} from "../../../components/toc/toc.component";
import {PreviewCard} from "../../../components/preview-card/preview-card";
@Component({
  selector: 'app-button-page',
  standalone: true,
    imports: [RouterLink, NgAtomsButtonDirective, CodeBlockComponent, NgAtomsBadgeDirective, TocComponent, PreviewCard],
  templateUrl: './button-page.component.html',
  styleUrl: './button-page.component.css',
})
export class ButtonPageComponent {
  loadingDemo = signal(false);
  loadingError = signal(false);

  triggerLoadingDemo() {
    if (this.loadingDemo()) return;
    this.loadingDemo.set(true);
    this.loadingError.set(false);
    setTimeout(() => {
      this.loadingDemo.set(false);
      this.loadingError.set(true);
      setTimeout(() => this.loadingError.set(false), 2000);
    }, 1600);
  }

  /* ── Code snippets ─────────────────────────────────────────── */

  readonly heroTemplate = `<button ngAtomsButton (click)="save()">Save changes</button>
<button ngAtomsButton variant="secondary">Cancel</button>
<button ngAtomsButton variant="ghost">Learn more</button>`;

  readonly heroComponent = `import { Component } from '@angular/core';
import { NgAtomsButtonDirective } from './ui/button';

@Component({
  standalone: true,
  selector: 'app-example',
  imports: [NgAtomsButtonDirective],
  templateUrl: './app.component.html',
})
export class AppExample {
  save() { /* ... */ }
}`;

  readonly usageInstallCode = 'ngatoms add button';

  readonly usageImportCode = `import { Component } from '@angular/core';
import { NgAtomsButtonDirective } from './ui/button';

@Component({
  standalone: true,
  selector: 'app-save-bar',
  imports: [NgAtomsButtonDirective],
  template: \`
    <button ngAtomsButton (click)="save()">Save changes</button>
    <button ngAtomsButton variant="secondary" (click)="cancel()">Cancel</button>
  \`,
})
export class SaveBar {
  save()   { /* ... */ }
  cancel() { /* ... */ }
}`;

  readonly variantsCode = `<button ngAtomsButton variant="primary">Primary</button>
<button ngAtomsButton variant="secondary">Secondary</button>
<button ngAtomsButton variant="outline">Outline</button>
<button ngAtomsButton variant="ghost">Ghost</button>
<button ngAtomsButton variant="destructive">Destructive</button>`;

  readonly sizesCode = `<button ngAtomsButton size="xs">Extra small</button>
<button ngAtomsButton size="sm">Small</button>
<button ngAtomsButton>Default</button>
<button ngAtomsButton size="lg">Large</button>
<button ngAtomsButton size="xl">Extra large</button>`;

  readonly iconCode = `<button ngAtomsButton>
  <i class="ph-bold ph-download-simple"></i>
  Download
</button>

<button ngAtomsButton variant="secondary">
  Next
  <i class="ph-bold ph-arrow-right"></i>
</button>

<button ngAtomsButton variant="ghost" aria-label="Open menu">
  <i class="ph-bold ph-list"></i>
</button>`;

  readonly loadingCode = `<button ngAtomsButton
  [loading]="saving()"
  [variant]="saveError() ? 'destructive' : 'primary'"
  (click)="save()">
  {{ saving() ? 'Saving…' : saveError() ? 'Failed — try again' : 'Save' }}
</button>`;

  readonly disabledCode = `<button ngAtomsButton [disabled]="true">Disabled</button>
<button ngAtomsButton variant="secondary" [disabled]="true">Disabled</button>`;

  readonly asLinkCode = `<a ngAtomsButton href="/pricing">See pricing</a>
<a ngAtomsButton variant="secondary" href="https://github.com/ngAtoms/ngatoms" target="_blank">
  View on GitHub
  <i class="ph-bold ph-arrow-up-right"></i>
</a>`;

  readonly recipeAsyncErrorCode = `import { Component, signal, inject } from '@angular/core';
import { NgAtomsButtonDirective } from './ui/button';
import { ContactApi } from './contact.api';

@Component({
  standalone: true,
  selector: 'app-contact-form',
  imports: [NgAtomsButtonDirective],
  template: \`
    <button ngAtomsButton
      [loading]="sending()"
      [variant]="sendError() ? 'destructive' : 'primary'"
      (click)="submit()">
      {{ sending() ? 'Sending…' : sendError() ? 'Failed — try again' : 'Send message' }}
    </button>
  \`,
})
export class ContactForm {
  private api = inject(ContactApi);
  sending = signal(false);
  sendError = signal(false);

  async submit() {
    this.sendError.set(false);
    await this.send().catch(() => this.sendError.set(true));
  }

  private async send() {
    this.sending.set(true);
    try {
      await this.api.send(/* ... */);
    } finally {
      this.sending.set(false);
    }
  }
}`;

  readonly recipeAsyncCode = `import { Component, signal, inject } from '@angular/core';
import { NgAtomsButtonDirective } from './ui/button';
import { ContactApi } from './contact.api';

@Component({
  standalone: true,
  selector: 'app-contact-form',
  imports: [NgAtomsButtonDirective],
  template: \`
    <form (ngSubmit)="submit()">
      <!-- fields -->
      <button ngAtomsButton type="submit" [loading]="sending()">
        {{ sending() ? 'Sending…' : 'Send message' }}
      </button>
    </form>
  \`,
})
export class ContactForm {
  private api = inject(ContactApi);
  sending = signal(false);

  async submit() {
    this.sending.set(true);
    try { await this.api.send(/* ... */); }
    finally { this.sending.set(false); }
  }
}`;

  readonly recipeDestructiveCode = `<button ngAtomsButton variant="destructive" (click)="dialog.open()">
  Delete account
</button>

<nga-dialog #dialog title="Delete account?">
  <p>This is permanent. All data will be erased.</p>
  <div dialog-actions>
    <button ngAtomsButton variant="ghost" (click)="dialog.close()">Keep account</button>
    <button ngAtomsButton variant="destructive" (click)="confirmDelete()">Yes, delete</button>
  </div>
</nga-dialog>`;

  /* ── Props table ───────────────────────────────────────────── */

  readonly props = [
    { name: 'variant',   type: `'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'`, defaultVal: `'primary'`,  description: 'Visual weight of the button.' },
    { name: 'size',      type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`,                             defaultVal: `'md'`,       description: 'Sizing preset. Affects padding and font-size.' },
    { name: 'disabled',  type: 'boolean',                                                        defaultVal: 'false',      description: 'Prevents interaction and removes the button from tab order.' },
    { name: 'loading',   type: 'boolean',                                                        defaultVal: 'false',      description: 'Shows a spinner, disables interactions, sets aria-busy="true".' },
    { name: 'fullWidth', type: 'boolean',                                                        defaultVal: 'false',      description: 'Stretches the button to 100% of its container width.' },
    { name: 'type',      type: `'button' | 'submit' | 'reset'`,                                 defaultVal: `'button'`,   description: 'Native button type attribute.' },
  ];

  /* ── A11y items ────────────────────────────────────────────── */

  readonly a11yItems = [
    { icon: 'keyboard',     title: 'Keyboard',      body: 'Activates on Space and Enter. Tab order follows source order; disabled buttons are skipped.' },
    { icon: 'spinner-gap',  title: 'Loading state', body: 'Sets aria-busy="true" and disables pointer events without removing focus — screen readers announce the state change.' },
    { icon: 'ear',          title: 'Icon-only buttons', body: 'Require an aria-label. The docs lint will warn if a button has no accessible text content.' },
    { icon: 'eye',          title: 'Focus ring',    body: 'Visible on keyboard focus, suppressed on mouse click. Honors the user\'s forced-color-scheme preference.' },
    { icon: 'circle-half',  title: 'Contrast',      body: 'All variant + state combinations pass WCAG 2.2 AA against their intended surface in both light and dark themes.' },
  ];

  /* ── TOC ───────────────────────────────────────────────────── */

  readonly tocItems = [
    { id: 'usage',    label: 'Usage' },
    { id: 'variants', label: 'Variants' },
    { id: 'sizes',    label: 'Sizes' },
    { id: 'with-icon', label: 'With icon' },
    { id: 'loading',  label: 'Loading' },
    { id: 'disabled', label: 'Disabled' },
    { id: 'as-link',  label: 'As link' },
    { id: 'api',      label: 'API' },
    { id: 'a11y',     label: 'Accessibility' },
    { id: 'recipes',  label: 'Recipes' },
    { id: 'recipe-error', label: '↳ Error handling' },
  ];

}
