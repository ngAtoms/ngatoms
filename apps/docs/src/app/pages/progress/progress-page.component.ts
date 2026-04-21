import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsProgressComponent } from '../../../components/progress';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const VARIANTS = ['default', 'accent', 'success', 'destructive'] as const;

@Component({
  selector: 'app-progress-page',
  standalone: true,
  imports: [RouterLink, NgAtomsProgressComponent, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './progress-page.component.html',
  styleUrl: './progress-page.component.css',
})
export class ProgressPageComponent {
  readonly variants = VARIANTS;

  readonly heroCode = `<nga-progress variant="accent" [value]="65" />`;

  readonly usageCode = `import { NgAtomsProgressComponent } from './ui/progress';

@Component({
  standalone: true,
  imports: [NgAtomsProgressComponent],
  template: \`<nga-progress variant="accent" [value]="uploadProgress()" />\`,
})
export class MyComponent {}`;

  readonly variantsCode = `<nga-progress variant="default"     [value]="65" />
<nga-progress variant="accent"      [value]="65" />
<nga-progress variant="success"     [value]="65" />
<nga-progress variant="destructive" [value]="65" />`;

  readonly sizesCode = `<nga-progress variant="accent" [value]="60" size="sm" />
<nga-progress variant="accent" [value]="60" size="md" />
<nga-progress variant="accent" [value]="60" size="lg" />`;

  readonly indeterminateCode = `<nga-progress variant="default"     [indeterminate]="true" />
<nga-progress variant="accent"      [indeterminate]="true" />
<nga-progress variant="success"     [indeterminate]="true" />
<nga-progress variant="destructive" [indeterminate]="true" />`;

  readonly props = [
    { name: 'value',         type: 'number',                                          defaultVal: '0',         description: 'Current value, between 0 and 100.' },
    { name: 'indeterminate', type: 'boolean',                                         defaultVal: 'false',     description: 'Shows an animated bar when completion is unknown.' },
    { name: 'variant',       type: `'default' | 'accent' | 'success' | 'destructive'`, defaultVal: `'default'`, description: 'Color of the progress fill.' },
    { name: 'size',          type: `'sm' | 'md' | 'lg'`,                              defaultVal: `'md'`,      description: 'Track height preset.' },
  ];

  readonly a11yItems = [
    { icon: 'chart-bar',     title: 'ARIA role',        body: 'role="progressbar" is set automatically. aria-valuenow reflects the current value and is updated reactively.' },
    { icon: 'minus-circle',  title: 'Indeterminate',    body: 'When indeterminate, aria-valuenow is removed so screen readers announce the loading state rather than a stale percentage.' },
    { icon: 'tag',           title: 'Labeling',         body: 'Pair with a visible label or aria-label to identify what is being measured (e.g. "Upload progress").' },
  ];

  readonly tocItems = [
    { id: 'usage',         label: 'Usage' },
    { id: 'variants',      label: 'Variants' },
    { id: 'sizes',         label: 'Sizes' },
    { id: 'indeterminate', label: 'Indeterminate' },
    { id: 'api',           label: 'API' },
    { id: 'a11y',          label: 'Accessibility' },
  ];
}
