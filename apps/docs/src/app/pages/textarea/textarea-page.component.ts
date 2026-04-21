import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsTextareaDirective } from '../../../components/textarea';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const VARIANTS = ['default', 'filled', 'ghost'] as const;
const SIZES    = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

@Component({
  selector: 'app-textarea-page',
  standalone: true,
  imports: [RouterLink, NgAtomsTextareaDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './textarea-page.component.html',
  styleUrl: './textarea-page.component.css',
})
export class TextareaPageComponent {
  readonly variants = VARIANTS;
  readonly sizes    = SIZES;

  readonly heroCode = `<textarea ngAtomsTextarea placeholder="Enter your message…"></textarea>`;

  readonly usageCode = `import { NgAtomsTextareaDirective } from './ui/textarea';

@Component({
  standalone: true,
  imports: [NgAtomsTextareaDirective],
  template: \`<textarea ngAtomsTextarea placeholder="Write something…"></textarea>\`,
})
export class MyComponent {}`;

  readonly variantsCode = `<textarea ngAtomsTextarea variant="default" placeholder="Default"></textarea>
<textarea ngAtomsTextarea variant="filled"  placeholder="Filled"></textarea>
<textarea ngAtomsTextarea variant="ghost"   placeholder="Ghost"></textarea>`;

  readonly sizesCode = `<textarea ngAtomsTextarea size="xs" placeholder="Extra small"></textarea>
<textarea ngAtomsTextarea size="sm" placeholder="Small"></textarea>
<textarea ngAtomsTextarea size="md" placeholder="Medium"></textarea>
<textarea ngAtomsTextarea size="lg" placeholder="Large"></textarea>
<textarea ngAtomsTextarea size="xl" placeholder="Extra large"></textarea>`;

  readonly statesCode = `<!-- Invalid -->
<textarea ngAtomsTextarea [invalid]="true" placeholder="This field has an error"></textarea>

<!-- Disabled -->
<textarea ngAtomsTextarea placeholder="Disabled textarea" disabled></textarea>

<!-- Readonly -->
<textarea ngAtomsTextarea readonly>This content is read-only.</textarea>

<!-- Auto-resize -->
<textarea ngAtomsTextarea [autoResize]="true" placeholder="Type to auto-resize…"></textarea>`;

  readonly props = [
    { name: 'variant',    type: `'default' | 'filled' | 'ghost'`,   defaultVal: `'default'`, description: 'Visual style of the textarea.' },
    { name: 'size',       type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`, defaultVal: `'md'`,      description: 'Sizing preset — affects padding and font size.' },
    { name: 'invalid',    type: 'boolean',                            defaultVal: 'false',     description: 'Applies error styling and sets aria-invalid="true".' },
    { name: 'autoResize', type: 'boolean',                            defaultVal: 'false',     description: 'Grows the textarea height automatically as the user types.' },
  ];

  readonly a11yItems = [
    { icon: 'tag',      title: 'Labels',   body: 'Associate a <label for="…"> or use aria-label / aria-labelledby. Placeholder text is not a substitute for a label.' },
    { icon: 'warning',  title: 'Invalid',  body: 'Setting [invalid]="true" adds aria-invalid="true" so screen readers surface the error state. Pair with an error message via aria-describedby.' },
    { icon: 'keyboard', title: 'Keyboard', body: 'All standard textarea interactions are preserved — Tab focuses the field, Enter inserts a line break, and the user can resize with native drag handle unless overridden.' },
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
