import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsRadioGroupComponent, NgAtomsRadioDirective } from '../../../components/radio-group';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-radio-group-page',
  standalone: true,
  imports: [RouterLink, NgAtomsRadioGroupComponent, NgAtomsRadioDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './radio-group-page.component.html',
  styleUrl: './radio-group-page.component.css',
})
export class RadioGroupPageComponent {
  readonly heroPlan = signal('pro');
  readonly plan     = signal('pro');
  readonly payment  = signal('card');
  readonly sizeSm   = signal('a');
  readonly sizeMd   = signal('a');
  readonly sizeLg   = signal('a');

  readonly heroCode = `<nga-radio-group [(value)]="plan">
  <label>
    <input ngAtomsRadio value="free" />
    <span>Free</span>
  </label>
  <label>
    <input ngAtomsRadio value="pro" />
    <span>Pro</span>
  </label>
  <label>
    <input ngAtomsRadio value="enterprise" />
    <span>Enterprise</span>
  </label>
</nga-radio-group>`;

  readonly usageCode = `import { Component, signal } from '@angular/core';
import { NgAtomsRadioGroupComponent, NgAtomsRadioDirective } from './ui/radio-group';

@Component({
  standalone: true,
  imports: [NgAtomsRadioGroupComponent, NgAtomsRadioDirective],
  template: \`
    <nga-radio-group [(value)]="plan">
      <label><input ngAtomsRadio value="free" /><span>Free</span></label>
      <label><input ngAtomsRadio value="pro"  /><span>Pro</span></label>
    </nga-radio-group>
  \`,
})
export class MyComponent {
  readonly plan = signal('free');
}`;

  readonly verticalCode = `<nga-radio-group [(value)]="plan">
  <label><input ngAtomsRadio value="free" /><span>Free</span></label>
  <label><input ngAtomsRadio value="pro"  /><span>Pro</span></label>
  <label><input ngAtomsRadio value="enterprise" /><span>Enterprise</span></label>
</nga-radio-group>`;

  readonly horizontalCode = `<nga-radio-group [(value)]="payment" orientation="horizontal">
  <label><input ngAtomsRadio value="card"   /><span>Card</span></label>
  <label><input ngAtomsRadio value="paypal" /><span>PayPal</span></label>
  <label><input ngAtomsRadio value="crypto" /><span>Crypto</span></label>
</nga-radio-group>`;

  readonly sizesCode = `<input ngAtomsRadio value="a" size="sm" />
<input ngAtomsRadio value="a" />
<input ngAtomsRadio value="a" size="lg" />`;

  readonly disabledCode = `<nga-radio-group value="active">
  <label><input ngAtomsRadio value="active" /><span>Active</span></label>
  <label><input ngAtomsRadio value="other" disabled /><span>Disabled option</span></label>
</nga-radio-group>`;

  readonly props = [
    { name: 'value',       type: 'string (model)',                    defaultVal: `''`,          description: 'Two-way binding for the selected radio value.' },
    { name: 'orientation', type: `'vertical' | 'horizontal'`,         defaultVal: `'vertical'`,  description: 'Layout direction of the radio options.' },
    { name: 'name',        type: 'string',                            defaultVal: 'auto',         description: 'Shared name attribute. Auto-generated if omitted.' },
  ];

  readonly a11yItems = [
    { icon: 'keyboard',    title: 'Keyboard',    body: 'Arrow keys navigate between options within the group. Space selects the focused option. Tab moves focus to the next interactive element outside the group.' },
    { icon: 'tag',         title: 'Labels',      body: 'Wrap each radio in a <label> or use aria-label. The label text is the accessible name for that option.' },
    { icon: 'circles',     title: 'Group name',  body: 'All radios in the group share a common name attribute (auto-generated). Screen readers announce each option as part of the group.' },
  ];

  readonly tocItems = [
    { id: 'usage',      label: 'Usage' },
    { id: 'vertical',   label: 'Vertical' },
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'sizes',      label: 'Sizes' },
    { id: 'disabled',   label: 'Disabled' },
    { id: 'api',        label: 'API' },
    { id: 'a11y',       label: 'Accessibility' },
  ];
}
