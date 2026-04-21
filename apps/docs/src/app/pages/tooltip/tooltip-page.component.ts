import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsTooltipDirective } from '../../../components/tooltip';
import { NgAtomsButtonDirective } from '../../../components/button';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-tooltip-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsTooltipDirective,
    NgAtomsButtonDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './tooltip-page.component.html',
  styleUrl: './tooltip-page.component.css',
})
export class TooltipPageComponent {
  readonly heroCode = `<button ngAtomsButton [ngAtomsTooltip]="'Save your changes'">
  Save
</button>`;

  readonly usageCode = `import { NgAtomsTooltipDirective } from './ui/tooltip';

@Component({
  standalone: true,
  imports: [NgAtomsTooltipDirective],
  template: \`
    <button [ngAtomsTooltip]="'Tooltip text'">Hover me</button>
  \`,
})
export class MyComponent {}`;

  readonly placementsCode = `<!-- Default: top -->
<button [ngAtomsTooltip]="'Appears above'" placement="top">Top</button>

<!-- Bottom -->
<button [ngAtomsTooltip]="'Appears below'" placement="bottom">Bottom</button>

<!-- Left -->
<button [ngAtomsTooltip]="'Appears to the left'" placement="left">Left</button>

<!-- Right -->
<button [ngAtomsTooltip]="'Appears to the right'" placement="right">Right</button>`;

  readonly elementsCode = `<!-- On a button -->
<button ngAtomsButton [ngAtomsTooltip]="'Save your changes'">Save</button>

<!-- On a badge -->
<span ngAtomsBadge [ngAtomsTooltip]="'This feature is in early access'">Beta</span>

<!-- On any element -->
<span [ngAtomsTooltip]="'Unique identifier assigned at account creation'">
  User ID <span>?</span>
</span>`;

  readonly longCode = `<button ngAtomsButton
  [ngAtomsTooltip]="'Two-factor authentication adds a second layer of security by requiring a verification code in addition to your password.'">
  Two-factor auth
</button>`;

  readonly props = [
    { name: 'ngAtomsTooltip', type: 'string',                                    defaultVal: '—',       description: 'Text to display in the tooltip. Falsy values disable the tooltip.' },
    { name: 'placement',      type: `'top' | 'bottom' | 'left' | 'right'`,       defaultVal: `'top'`,   description: 'Which side the tooltip appears on relative to the trigger.' },
    { name: 'delay',          type: 'number',                                     defaultVal: '300',     description: 'Milliseconds to wait before showing the tooltip on hover.' },
  ];

  readonly a11yItems = [
    { icon: 'keyboard',   title: 'Keyboard focus', body: 'Tooltips appear on both hover and keyboard focus, so keyboard-only users get the same contextual information.' },
    { icon: 'text-aa',    title: 'Accessible name', body: 'Use tooltips on icon-only buttons to provide an accessible name (in addition to aria-label for robustness).' },
    { icon: 'prohibit',   title: 'Interactive content', body: 'Tooltips are pointer-events:none and cannot contain interactive elements. Use a Popover for rich content.' },
    { icon: 'arrows-out-simple', title: 'Repositioning', body: 'The tooltip remains visible and automatically repositions itself when the page is scrolled, staying anchored to its trigger.' },
  ];

  readonly tocItems = [
    { id: 'usage',      label: 'Usage' },
    { id: 'placements', label: 'Placements' },
    { id: 'elements',   label: 'On different elements' },
    { id: 'long',       label: 'Long content' },
    { id: 'api',        label: 'API' },
    { id: 'a11y',       label: 'Accessibility' },
  ];
}
