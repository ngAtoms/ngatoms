import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsSeparatorDirective } from '../../../components/separator';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-separator-page',
  standalone: true,
  imports: [RouterLink, NgAtomsSeparatorDirective, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './separator-page.component.html',
  styleUrl: './separator-page.component.css',
})
export class SeparatorPageComponent {

  readonly heroCode = `<p>Section A</p>
<div ngAtomsSeparator></div>
<p>Section B</p>`;

  readonly usageCode = `import { NgAtomsSeparatorDirective } from './ui/separator';

@Component({
  standalone: true,
  imports: [NgAtomsSeparatorDirective],
  template: \`
    <p>Section A</p>
    <div ngAtomsSeparator></div>
    <p>Section B</p>
  \`,
})
export class MyComponent {}`;

  readonly horizontalCode = `<p>Section A</p>
<div ngAtomsSeparator></div>
<p>Section B</p>
<div ngAtomsSeparator></div>
<p>Section C</p>`;

  readonly verticalCode = `<div style="display: flex; align-items: center; gap: 0.75rem;">
  <span>Home</span>
  <div ngAtomsSeparator orientation="vertical"></div>
  <span>Components</span>
  <div ngAtomsSeparator orientation="vertical"></div>
  <span>Separator</span>
</div>`;

  readonly props = [
    {
      name: 'orientation',
      type: `'horizontal' | 'vertical'`,
      defaultVal: `'horizontal'`,
      description: 'Direction of the separator line.',
    },
  ];

  readonly a11yItems = [
    { icon: 'layout',    title: 'Role',         body: 'role="separator" is set automatically, identifying the divider as a landmark boundary for assistive technologies.' },
    { icon: 'eye-slash', title: 'Decorative',   body: 'When the separator is purely decorative, add aria-hidden="true" to remove it from the accessibility tree entirely.' },
  ];

  readonly tocItems = [
    { id: 'usage',      label: 'Usage' },
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'vertical',   label: 'Vertical' },
    { id: 'api',        label: 'API' },
    { id: 'a11y',       label: 'Accessibility' },
  ];
}
