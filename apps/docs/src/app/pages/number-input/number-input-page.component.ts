import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsNumberInputComponent } from '../../../components/number-input';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-number-input-page',
  standalone: true,
  imports: [RouterLink, NgAtomsNumberInputComponent, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './number-input-page.component.html',
  styleUrl: './number-input-page.component.css',
})
export class NumberInputPageComponent {
  readonly heroVal   = signal(1);
  readonly sizeVal   = signal(5);
  readonly ratingVal = signal(5);
  readonly tempVal   = signal(20.5);

  readonly heroCode = `<nga-number-input [(value)]="qty" [min]="0" [max]="99" />`;

  readonly usageCode = `import { Component, signal } from '@angular/core';
import { NgAtomsNumberInputComponent } from './ui/number-input';

@Component({
  standalone: true,
  imports: [NgAtomsNumberInputComponent],
  template: \`<nga-number-input [(value)]="qty" [min]="1" [max]="99" />\`,
})
export class MyComponent {
  readonly qty = signal(1);
}`;

  readonly sizesCode = `<nga-number-input [(value)]="qty" size="sm" [min]="0" />
<nga-number-input [(value)]="qty" size="md" [min]="0" />
<nga-number-input [(value)]="qty" size="lg" [min]="0" />`;

  readonly constraintsCode = `<!-- Min 1, max 10 -->
<nga-number-input [(value)]="rating" [min]="1" [max]="10" />

<!-- Step 0.5 -->
<nga-number-input [(value)]="temp" [step]="0.5" />`;

  readonly disabledCode = `<nga-number-input [value]="42" [disabled]="true" />`;

  readonly props = [
    { name: 'value',    type: 'number (model)',             defaultVal: '0',        description: 'Two-way binding for the numeric value. Use [(value)].' },
    { name: 'min',      type: 'number',                     defaultVal: '-Infinity', description: 'Minimum allowed value. Decrement is disabled when at min.' },
    { name: 'max',      type: 'number',                     defaultVal: 'Infinity',  description: 'Maximum allowed value. Increment is disabled when at max.' },
    { name: 'step',     type: 'number',                     defaultVal: '1',         description: 'Amount added/subtracted on each increment/decrement.' },
    { name: 'size',     type: `'sm' | 'md' | 'lg'`,         defaultVal: `'md'`,     description: 'Size preset for the control.' },
    { name: 'disabled', type: 'boolean',                    defaultVal: 'false',     description: 'Prevents all interaction.' },
    { name: 'invalid',  type: 'boolean',                    defaultVal: 'false',     description: 'Applies error styling to the input.' },
  ];

  readonly a11yItems = [
    { icon: 'keyboard',  title: 'Keyboard',   body: 'Arrow Up/Down increment and decrement the value. The text field is editable directly; values outside min/max are clamped on blur.' },
    { icon: 'tag',       title: 'Labels',     body: 'Provide a visible <label> or aria-label so screen readers announce the field name alongside the current value.' },
    { icon: 'lock',      title: 'Boundaries', body: 'Increment/decrement buttons acquire aria-disabled when the value is at its boundary, preventing confusing interactions.' },
  ];

  readonly tocItems = [
    { id: 'usage',       label: 'Usage' },
    { id: 'sizes',       label: 'Sizes' },
    { id: 'constraints', label: 'Min, max, and step' },
    { id: 'disabled',    label: 'Disabled' },
    { id: 'api',         label: 'API' },
    { id: 'a11y',        label: 'Accessibility' },
  ];
}
