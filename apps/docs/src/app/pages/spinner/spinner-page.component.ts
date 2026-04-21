import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsSpinnerDirective } from '../../../components/spinner';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const SIZES = ['sm', 'md', 'lg'] as const;

@Component({
  selector: 'app-spinner-page',
  standalone: true,
  imports: [RouterLink, NgAtomsSpinnerDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './spinner-page.component.html',
  styleUrl: './spinner-page.component.css',
})
export class SpinnerPageComponent {
  readonly sizes = SIZES;

  readonly heroCode = `<span ngAtomsSpinner size="md"></span>`;

  readonly usageCode = `import { NgAtomsSpinnerDirective } from './ui/spinner';

@Component({
  standalone: true,
  imports: [NgAtomsSpinnerDirective],
  template: \`
    @if (loading()) {
      <span ngAtomsSpinner size="md"></span>
    }
  \`,
})
export class MyComponent {}`;

  readonly sizesCode = `<span ngAtomsSpinner size="sm"></span>
<span ngAtomsSpinner size="md"></span>
<span ngAtomsSpinner size="lg"></span>`;

  readonly colorsCode = `<!-- Inherits the current CSS color -->
<span ngAtomsSpinner style="color: var(--nga-color-accent)"></span>
<span ngAtomsSpinner style="color: var(--nga-color-destructive)"></span>
<span ngAtomsSpinner style="color: var(--nga-color-success)"></span>`;

  readonly props = [
    { name: 'size', type: `'sm' | 'md' | 'lg'`, defaultVal: `'md'`, description: 'Size of the spinning indicator.' },
  ];

  readonly a11yItems = [
    { icon: 'speaker-high', title: 'Live region',   body: 'role="status" acts as a polite live region — screen readers announce "Loading" without interrupting the current speech.' },
    { icon: 'tag',          title: 'Custom label',  body: 'Override aria-label to describe the specific operation: <span ngAtomsSpinner aria-label="Uploading file"></span>.' },
    { icon: 'eye-slash',    title: 'Hide when done', body: 'Remove or hide the spinner when the operation completes. A persistent spinner is confusing for screen reader users.' },
  ];

  readonly tocItems = [
    { id: 'usage',  label: 'Usage' },
    { id: 'sizes',  label: 'Sizes' },
    { id: 'colors', label: 'Colors' },
    { id: 'api',    label: 'API' },
    { id: 'a11y',   label: 'Accessibility' },
  ];
}
