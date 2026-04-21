import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NgAtomsCardDirective,
  NgAtomsCardHeaderDirective,
  NgAtomsCardTitleDirective,
  NgAtomsCardDescriptionDirective,
  NgAtomsCardContentDirective,
  NgAtomsCardFooterDirective,
} from '../../../components/card';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { NgAtomsButtonDirective } from '../../../components/button';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-card-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsCardDirective,
    NgAtomsCardHeaderDirective,
    NgAtomsCardTitleDirective,
    NgAtomsCardDescriptionDirective,
    NgAtomsCardContentDirective,
    NgAtomsCardFooterDirective,
    NgAtomsBadgeDirective,
    NgAtomsButtonDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './card-page.component.html',
  styleUrl: './card-page.component.css',
})
export class CardPageComponent {
  readonly heroCode = `<div ngAtomsCard>
  <div ngAtomsCardHeader>
    <h3 ngAtomsCardTitle>Card title</h3>
    <p ngAtomsCardDescription>A short description of the card content.</p>
  </div>
  <div ngAtomsCardContent>
    <p>Main content area goes here.</p>
  </div>
  <div ngAtomsCardFooter>
    <button ngAtomsButton variant="outline" size="sm">Cancel</button>
    <button ngAtomsButton size="sm">Confirm</button>
  </div>
</div>`;

  readonly usageCode = `import {
  NgAtomsCardDirective,
  NgAtomsCardHeaderDirective,
  NgAtomsCardTitleDirective,
  NgAtomsCardDescriptionDirective,
  NgAtomsCardContentDirective,
  NgAtomsCardFooterDirective,
} from './ui/card';

@Component({
  standalone: true,
  imports: [
    NgAtomsCardDirective, NgAtomsCardHeaderDirective, NgAtomsCardTitleDirective,
    NgAtomsCardDescriptionDirective, NgAtomsCardContentDirective, NgAtomsCardFooterDirective,
  ],
  templateUrl: './my.component.html',
})
export class MyComponent {}`;

  readonly anatomyCode = `<div ngAtomsCard>
  <!-- header: title + description -->
  <div ngAtomsCardHeader>
    <h3 ngAtomsCardTitle>Title</h3>
    <p ngAtomsCardDescription>Description text.</p>
  </div>

  <!-- content: the main body area -->
  <div ngAtomsCardContent>
    <p>Any content goes here.</p>
  </div>

  <!-- footer: actions or supplemental info -->
  <div ngAtomsCardFooter>
    <button ngAtomsButton size="sm">Action</button>
  </div>
</div>`;

  readonly interactiveCode = `<!-- Add role="button" or .nga-card--interactive for a clickable card -->
<div ngAtomsCard role="button" (click)="select()">
  <div ngAtomsCardHeader>
    <h3 ngAtomsCardTitle>Clickable card</h3>
    <p ngAtomsCardDescription>Click anywhere on this card.</p>
  </div>
</div>`;

  readonly badgeCode = `<div ngAtomsCard>
  <div ngAtomsCardHeader>
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <h3 ngAtomsCardTitle>API Access</h3>
      <span ngAtomsBadge variant="success">Active</span>
    </div>
    <p ngAtomsCardDescription>Manage your API keys and access tokens.</p>
  </div>
  <div ngAtomsCardContent>
    <code>sk-••••••••••••3f9a</code>
  </div>
  <div ngAtomsCardFooter>
    <button ngAtomsButton variant="destructive" size="sm">Revoke</button>
    <button ngAtomsButton variant="outline" size="sm">Regenerate</button>
  </div>
</div>`;

  readonly props = [
    { name: 'ngAtomsCard',            type: 'directive (host)',  defaultVal: '—',     description: 'Applied to the root container. Adds card styles and layout.' },
    { name: 'ngAtomsCardHeader',      type: 'directive (host)',  defaultVal: '—',     description: 'Header region. Stacks title and description vertically.' },
    { name: 'ngAtomsCardTitle',       type: 'directive (host)',  defaultVal: '—',     description: 'Title text inside the header.' },
    { name: 'ngAtomsCardDescription', type: 'directive (host)',  defaultVal: '—',     description: 'Secondary text below the title.' },
    { name: 'ngAtomsCardContent',     type: 'directive (host)',  defaultVal: '—',     description: 'Main content region with padding.' },
    { name: 'ngAtomsCardFooter',      type: 'directive (host)',  defaultVal: '—',     description: 'Footer region, typically holding actions.' },
  ];

  readonly a11yItems = [
    { icon: 'mouse',           title: 'Interactive cards',  body: 'Add role="button" and (click) when the card itself is the action target — not an internal button. This makes it keyboard-focusable.' },
    { icon: 'text-aa',         title: 'Headings',           body: 'Use the correct heading level for ngAtomsCardTitle to maintain document outline — h2, h3, etc. as fits the page hierarchy.' },
    { icon: 'keyboard',        title: 'Keyboard',           body: 'Interactive cards respond to Enter and Space when role="button". Non-interactive cards are not in the tab order.' },
  ];

  readonly tocItems = [
    { id: 'usage',       label: 'Usage' },
    { id: 'anatomy',     label: 'Anatomy' },
    { id: 'interactive', label: 'Interactive' },
    { id: 'with-badge',  label: 'With badge' },
    { id: 'api',         label: 'API' },
    { id: 'a11y',        label: 'Accessibility' },
  ];
}
