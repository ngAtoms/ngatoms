import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsSelectComponent, NgAtomsSelectOption } from '../../../components/select';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';
@Component({
  selector: 'app-select-page',
  standalone: true,
    imports: [
        RouterLink,
        NgAtomsSelectComponent,
        NgAtomsBadgeDirective,
        CodeBlockComponent,
        TocComponent,
        PreviewCard,
    ],
  templateUrl: './select-page.component.html',
  styleUrl: './select-page.component.css',
})
export class SelectPageComponent {
  readonly skills = signal<string[]>([]);

  readonly selectedSkillLabels = computed(() =>
    this.skills().map(v => this.skillOptions.find(o => o.value === v)?.label ?? v).join(', ')
  );

  readonly departments: NgAtomsSelectOption[] = [
    { value: 'eng',     label: 'Engineering' },
    { value: 'design',  label: 'Design' },
    { value: 'mkt',     label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr',      label: 'Human Resources' },
  ];

  readonly roles: NgAtomsSelectOption[] = [
    { value: 'admin',   label: 'Admin' },
    { value: 'editor',  label: 'Editor' },
    { value: 'viewer',  label: 'Viewer' },
    { value: 'guest',   label: 'Guest', disabled: true },
  ];

  readonly countries: NgAtomsSelectOption[] = [
    { value: 'br', label: 'Brazil' },
    { value: 'de', label: 'Germany' },
    { value: 'jp', label: 'Japan' },
    { value: 'pt', label: 'Portugal' },
    { value: 'us', label: 'United States' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'fr', label: 'France' },
    { value: 'ca', label: 'Canada' },
  ];

  readonly skillOptions: NgAtomsSelectOption[] = [
    { value: 'ts',     label: 'TypeScript' },
    { value: 'ng',     label: 'Angular' },
    { value: 'react',  label: 'React' },
    { value: 'vue',    label: 'Vue' },
    { value: 'node',   label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'rust',   label: 'Rust' },
    { value: 'go',     label: 'Go' },
  ];

  readonly heroCode = `<nga-select [options]="options" [(value)]="selected" placeholder="Choose department" />`;

  readonly usageCode = `import { NgAtomsSelectComponent, NgAtomsSelectOption } from './ui/select';
import { signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [NgAtomsSelectComponent],
  template: \`
    <nga-select [options]="roles" [(value)]="role" placeholder="Select role" />
  \`,
})
export class MyComponent {
  readonly role = signal<string | null>(null);

  readonly roles: NgAtomsSelectOption[] = [
    { value: 'admin',  label: 'Admin' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];
}`;

  readonly variantsCode = `<nga-select [options]="options" placeholder="Default" />
<nga-select [options]="options" variant="filled" placeholder="Filled" />
<nga-select [options]="options" variant="ghost" placeholder="Ghost" />`;

  readonly sizesCode = `<nga-select [options]="options" size="xs" placeholder="Extra small" />
<nga-select [options]="options" size="sm" placeholder="Small" />
<nga-select [options]="options" size="md" placeholder="Medium" />
<nga-select [options]="options" size="lg" placeholder="Large" />
<nga-select [options]="options" size="xl" placeholder="Extra large" />`;

  readonly searchCode = `<nga-select
  [options]="countries"
  [searchable]="true"
  placeholder="Search countries..."
/>`;

  readonly multipleCode = `<nga-select
  [options]="skillOptions"
  [multiple]="true"
  [searchable]="true"
  [(value)]="skills"
  placeholder="Select skills..."
/>`;

  readonly statesCode = `<!-- Invalid -->
<nga-select [options]="options" [invalid]="true" placeholder="Select role" />

<!-- Disabled -->
<nga-select [options]="options" [disabled]="true" placeholder="Unavailable" />`;

  readonly props = [
    { name: 'options',      type: 'NgAtomsSelectOption[]',                       defaultVal: '[]',          description: 'Array of options. Each item has value, label, and optional disabled.' },
    { name: 'value',        type: 'string | string[] | null',                    defaultVal: 'null',         description: 'Two-way bound selected value (or array if multiple).' },
    { name: 'placeholder',  type: 'string',                                      defaultVal: `''`,           description: 'Shown when no value is selected.' },
    { name: 'variant',      type: `'default' | 'filled' | 'ghost'`,              defaultVal: `'default'`,    description: 'Visual style of the trigger.' },
    { name: 'size',         type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`,           defaultVal: `'md'`,         description: 'Sizing preset.' },
    { name: 'multiple',     type: 'boolean',                                     defaultVal: 'false',        description: 'Allows selecting more than one option.' },
    { name: 'searchable',   type: 'boolean',                                     defaultVal: 'false',        description: 'Shows a search input at the top of the panel.' },
    { name: 'invalid',      type: 'boolean',                                     defaultVal: 'false',        description: 'Applies error state styling to the trigger.' },
    { name: 'disabled',     type: 'boolean',                                     defaultVal: 'false',        description: 'Prevents interaction with the select.' },
  ];

  readonly a11yItems = [
    { term: 'Keyboard',      body: 'Arrow keys navigate options. Enter or Space selects. Escape closes the panel and returns focus to the trigger. Home/End jump to the first and last option.' },
    { term: 'Focus ring',    body: 'Visible focus ring on keyboard navigation. The trigger exposes aria-expanded and aria-haspopup="listbox". aria-activedescendant tracks the focused option for screen readers.' },
    { term: 'Search',        body: 'When searchable, options filter as you type. A live region announces the count of matching results after each keystroke.' },
    { term: 'Disabled',      body: 'Disabled options carry aria-disabled="true" so screen readers announce them as unavailable rather than silently refusing selection.' },
  ];

  readonly tocItems = [
    { id: 'usage',    label: 'Usage' },
    { id: 'variants', label: 'Variants' },
    { id: 'sizes',    label: 'Sizes' },
    { id: 'search',   label: 'Searchable' },
    { id: 'multiple', label: 'Multiple' },
    { id: 'states',   label: 'States' },
    { id: 'api',      label: 'API' },
    { id: 'a11y',     label: 'Accessibility' },
  ];
}
