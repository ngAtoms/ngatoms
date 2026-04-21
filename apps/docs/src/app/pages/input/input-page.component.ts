import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsInputDirective } from '../../../components/input';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const VARIANTS = ['default', 'filled', 'ghost'] as const;
const SIZES    = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

@Component({
  selector: 'app-input-page',
  standalone: true,
  imports: [RouterLink, NgAtomsInputDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './input-page.component.html',
  styleUrl: './input-page.component.css',
})
export class InputPageComponent {
  readonly variants = VARIANTS;
  readonly sizes    = SIZES;

  readonly heroCode = `<input ngAtomsInput placeholder="Enter your email…" />`;

  readonly usageCode = `import { NgAtomsInputDirective } from './ui/input';

@Component({
  standalone: true,
  imports: [NgAtomsInputDirective],
  template: \`<input ngAtomsInput placeholder="Search…" />\`,
})
export class MyComponent {}`;

  readonly variantsCode = `<input ngAtomsInput variant="default" placeholder="Default" />
<input ngAtomsInput variant="filled"  placeholder="Filled" />
<input ngAtomsInput variant="ghost"   placeholder="Ghost" />`;

  readonly sizesCode = `<input ngAtomsInput size="xs" placeholder="Extra small" />
<input ngAtomsInput size="sm" placeholder="Small" />
<input ngAtomsInput size="md" placeholder="Medium" />
<input ngAtomsInput size="lg" placeholder="Large" />
<input ngAtomsInput size="xl" placeholder="Extra large" />`;

  readonly statesCode = `<input ngAtomsInput placeholder="Default input" />
<input ngAtomsInput [invalid]="true" placeholder="Invalid input" />
<input ngAtomsInput placeholder="Disabled input" disabled />
<input ngAtomsInput value="Readonly value" readonly />`;

  readonly props = [
    { name: 'variant', type: `'default' | 'filled' | 'ghost'`,       defaultVal: `'default'`, description: 'Visual style of the input.' },
    { name: 'size',    type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`,     defaultVal: `'md'`,      description: 'Sizing preset — affects height and font size.' },
    { name: 'invalid', type: 'boolean',                                defaultVal: 'false',     description: 'Applies error styling and sets aria-invalid="true".' },
  ];

  readonly a11yItems = [
    { icon: 'tag',        title: 'Labels',      body: 'Associate a <label for="…"> or use aria-label / aria-labelledby. Placeholder text is not a substitute for a label.' },
    { icon: 'warning',    title: 'Invalid',     body: 'Setting [invalid]="true" adds aria-invalid="true" so screen readers surface the error state. Pair with an error message using aria-describedby.' },
    { icon: 'keyboard',   title: 'Keyboard',    body: 'All standard input keyboard interactions are preserved. Tab focuses the field; the user can edit with arrow keys and shortcuts.' },
  ];

  readonly tocItems = [
    { id: 'usage',    label: 'Usage' },
    { id: 'variants', label: 'Variants' },
    { id: 'sizes',    label: 'Sizes' },
    { id: 'states',   label: 'States' },
    { id: 'api',      label: 'API' },
    { id: 'a11y',     label: 'Accessibility' },
  ];
}
