import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const VARIANTS = ['default', 'ember', 'success', 'warning', 'destructive', 'solid', 'outline'] as const;

@Component({
  selector: 'app-badge-page',
  standalone: true,
  imports: [RouterLink, NgAtomsBadgeDirective, CodeBlockComponent, TocComponent, PreviewCard],
  templateUrl: './badge-page.component.html',
  styleUrl: './badge-page.component.css',
})
export class BadgePageComponent {
  readonly variants = VARIANTS;

  readonly heroCode = `<span ngAtomsBadge variant="default">New</span>
<span ngAtomsBadge variant="success">Active</span>
<span ngAtomsBadge variant="warning">Pending</span>
<span ngAtomsBadge variant="destructive">Deprecated</span>`;

  readonly usageCode = `import { NgAtomsBadgeDirective } from './ui/badge';

@Component({
  standalone: true,
  imports: [NgAtomsBadgeDirective],
  template: \`
    <span ngAtomsBadge variant="success">Active</span>
    <span ngAtomsBadge variant="warning">Pending</span>
  \`,
})
export class MyComponent {}`;

  readonly variantsCode = `<span ngAtomsBadge variant="default">Default</span>
<span ngAtomsBadge variant="ember">Ember</span>
<span ngAtomsBadge variant="success">Success</span>
<span ngAtomsBadge variant="warning">Warning</span>
<span ngAtomsBadge variant="destructive">Destructive</span>
<span ngAtomsBadge variant="solid">Solid</span>
<span ngAtomsBadge variant="outline">Outline</span>`;

  readonly iconCode = `<span ngAtomsBadge variant="success"><i class="ph ph-check-circle"></i> Stable</span>
<span ngAtomsBadge variant="warning"><i class="ph ph-clock"></i> Beta</span>
<span ngAtomsBadge variant="destructive"><i class="ph ph-x-circle"></i> Deprecated</span>`;

  readonly linkCode = `<a ngAtomsBadge variant="outline" href="..." target="_blank">
  <i class="ph ph-arrow-square-out"></i> Source
</a>`;

  readonly props = [
    {
      name: 'variant',
      type: `'default' | 'ember' | 'success' | 'warning' | 'destructive' | 'solid' | 'outline'`,
      defaultVal: `'default'`,
      description: 'Visual style and semantic color of the badge.',
    },
  ];

  readonly a11yItems = [
    { icon: 'text-aa',   title: 'Color + text',  body: 'Each variant pairs color with a text label so meaning is never conveyed by color alone.' },
    { icon: 'link',      title: 'Anchor badges', body: 'When applied to an <a> tag, the badge inherits link semantics — screen readers announce it as a link and it is keyboard-navigable.' },
    { icon: 'eye',       title: 'Contrast',      body: 'All variant + theme combinations pass WCAG 2.2 AA contrast against their intended surface.' },
  ];

  readonly tocItems = [
    { id: 'usage',     label: 'Usage' },
    { id: 'variants',  label: 'Variants' },
    { id: 'with-icon', label: 'With icons' },
    { id: 'as-link',   label: 'As link' },
    { id: 'api',       label: 'API' },
    { id: 'a11y',      label: 'Accessibility' },
  ];
}
