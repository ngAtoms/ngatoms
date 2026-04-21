import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsSwitchDirective } from '../../../components/switch';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-switch-page',
  standalone: true,
  imports: [RouterLink, NgAtomsSwitchDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './switch-page.component.html',
  styleUrl: './switch-page.component.css',
})
export class SwitchPageComponent {
  readonly heroOn        = signal(true);
  readonly stateOff      = signal(false);
  readonly stateOn       = signal(true);
  readonly notifications = signal(true);
  readonly autoSave      = signal(true);
  readonly analytics     = signal(false);

  readonly heroCode = `<label>
  <input ngAtomsSwitch [(checked)]="isEnabled" />
  <span>Push notifications</span>
</label>`;

  readonly usageCode = `import { Component, signal } from '@angular/core';
import { NgAtomsSwitchDirective } from './ui/switch';

@Component({
  standalone: true,
  imports: [NgAtomsSwitchDirective],
  template: \`
    <label>
      <input ngAtomsSwitch [(checked)]="isEnabled" />
      <span>Enable feature</span>
    </label>
  \`,
})
export class MyComponent {
  readonly isEnabled = signal(false);
}`;

  readonly statesCode = `<!-- Off -->
<label><input ngAtomsSwitch [(checked)]="isOff" /><span>Off</span></label>

<!-- On -->
<label><input ngAtomsSwitch [checked]="true" /><span>On</span></label>

<!-- Disabled off -->
<label><input ngAtomsSwitch [checked]="false" disabled /><span>Off</span></label>

<!-- Disabled on -->
<label><input ngAtomsSwitch [checked]="true" disabled /><span>On</span></label>`;

  readonly sizesCode = `<input ngAtomsSwitch size="sm" [checked]="true" />
<input ngAtomsSwitch size="md" [checked]="true" />
<input ngAtomsSwitch size="lg" [checked]="true" />`;

  readonly listCode = `<div class="settings-row">
  <div>
    <p>Push notifications</p>
    <p>Receive alerts for new activity</p>
  </div>
  <input ngAtomsSwitch [(checked)]="notifications" />
</div>`;

  readonly props = [
    { name: 'checked', type: 'boolean (model)',     defaultVal: 'false', description: 'Two-way binding for the on/off state. Use [(checked)].' },
    { name: 'size',    type: `'sm' | 'md' | 'lg'`, defaultVal: `'md'`, description: 'Size preset for the switch track.' },
  ];

  readonly a11yItems = [
    { icon: 'toggle-left',  title: 'Role',    body: 'role="switch" is set automatically. Screen readers announce the state as "on" or "off" rather than "checked" or "unchecked".' },
    { icon: 'keyboard',     title: 'Keyboard', body: 'Space toggles the focused switch. Tab moves between switches in source order.' },
    { icon: 'tag',          title: 'Labels',   body: 'Always wrap in a <label> or use aria-label. The label text describes what the switch controls.' },
  ];

  readonly tocItems = [
    { id: 'usage',         label: 'Usage' },
    { id: 'states',        label: 'States' },
    { id: 'sizes',         label: 'Sizes' },
    { id: 'settings-list', label: 'Settings list' },
    { id: 'api',           label: 'API' },
    { id: 'a11y',          label: 'Accessibility' },
  ];
}
