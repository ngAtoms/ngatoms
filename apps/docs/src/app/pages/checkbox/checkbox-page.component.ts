import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsCheckboxDirective } from '../../../components/checkbox';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-checkbox-page',
  standalone: true,
  imports: [RouterLink, NgAtomsCheckboxDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './checkbox-page.component.html',
  styleUrl: './checkbox-page.component.css',
})
export class CheckboxPageComponent {
  readonly heroChecked  = signal(false);
  readonly stateUnchecked = signal(false);
  readonly stateChecked   = signal(true);

  readonly heroCode = `<label>
  <input ngAtomsCheckbox [(checked)]="isAccepted" />
  <span>Accept terms and conditions</span>
</label>`;

  readonly usageCode = `import { Component, signal } from '@angular/core';
import { NgAtomsCheckboxDirective } from './ui/checkbox';

@Component({
  standalone: true,
  imports: [NgAtomsCheckboxDirective],
  template: \`
    <label>
      <input ngAtomsCheckbox [(checked)]="agreed" />
      <span>I agree to the terms</span>
    </label>
  \`,
})
export class MyComponent {
  readonly agreed = signal(false);
}`;

  readonly statesCode = `<!-- Unchecked -->
<label>
  <input ngAtomsCheckbox [(checked)]="isChecked" />
  <span>Unchecked</span>
</label>

<!-- Checked -->
<label>
  <input ngAtomsCheckbox [checked]="true" />
  <span>Checked</span>
</label>

<!-- Indeterminate -->
<label>
  <input ngAtomsCheckbox [indeterminate]="true" />
  <span>Indeterminate</span>
</label>

<!-- Disabled -->
<label>
  <input ngAtomsCheckbox [checked]="true" disabled />
  <span>Disabled</span>
</label>`;

  readonly sizesCode = `<label>
  <input ngAtomsCheckbox size="sm" [checked]="true" />
  <span>Small</span>
</label>

<label>
  <input ngAtomsCheckbox size="md" [checked]="true" />
  <span>Medium</span>
</label>

<label>
  <input ngAtomsCheckbox size="lg" [checked]="true" />
  <span>Large</span>
</label>`;

  readonly listCode = `<label>
  <input ngAtomsCheckbox [checked]="true" />
  <span>Accept terms and conditions</span>
</label>
<label>
  <input ngAtomsCheckbox [checked]="true" />
  <span>Subscribe to newsletter</span>
</label>
<label>
  <input ngAtomsCheckbox />
  <span>Enable two-factor authentication</span>
</label>`;

  readonly props = [
    { name: 'checked',       type: 'boolean (model)',    defaultVal: 'false', description: 'Two-way binding for the checked state. Use [(checked)].' },
    { name: 'indeterminate', type: 'boolean',            defaultVal: 'false', description: 'Shows the mixed/partial state. Does not affect the checked model.' },
    { name: 'size',          type: `'sm' | 'md' | 'lg'`, defaultVal: `'md'`, description: 'Size preset for the checkbox control.' },
  ];

  readonly a11yItems = [
    { icon: 'keyboard',      title: 'Keyboard',         body: 'Space toggles the focused checkbox. Tab moves between checkboxes in source order.' },
    { icon: 'tag',           title: 'Labels',           body: 'Always wrap in a <label> or use aria-label. The label text becomes the accessible name.' },
    { icon: 'minus-circle',  title: 'Indeterminate',    body: 'Sets aria-checked="mixed" so screen readers announce the partial state correctly.' },
  ];

  readonly tocItems = [
    { id: 'usage',     label: 'Usage' },
    { id: 'states',    label: 'States' },
    { id: 'sizes',     label: 'Sizes' },
    { id: 'in-a-list', label: 'In a list' },
    { id: 'api',       label: 'API' },
    { id: 'a11y',      label: 'Accessibility' },
  ];
}
