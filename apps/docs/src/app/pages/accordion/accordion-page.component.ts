import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsAccordionComponent } from '../../../components/accordion/accordion.component';
import { NgAtomsAccordionItemComponent } from '../../../components/accordion/accordion-item.component';
import { NgAtomsAccordionTriggerDirective } from '../../../components/accordion/accordion-trigger.directive';
import { NgAtomsAccordionContentDirective } from '../../../components/accordion/accordion-content.directive';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-accordion-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsAccordionComponent,
    NgAtomsAccordionItemComponent,
    NgAtomsAccordionTriggerDirective,
    NgAtomsAccordionContentDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './accordion-page.component.html',
  styleUrl: './accordion-page.component.css',
})
export class AccordionPageComponent {

  readonly heroCode = `<nga-accordion defaultValue="what">
  <nga-accordion-item value="what">
    <button ngAtomsAccordionTrigger>What is NgAtoms?</button>
    <div ngAtomsAccordionContent>
      NgAtoms is a collection of Angular UI primitives designed to be copied
      directly into your project. No runtime dependencies — you own the code.
    </div>
  </nga-accordion-item>
  <nga-accordion-item value="how">
    <button ngAtomsAccordionTrigger>How does it work?</button>
    <div ngAtomsAccordionContent>
      Run ngatoms add accordion and the files are copied into your codebase.
    </div>
  </nga-accordion-item>
</nga-accordion>`;

  readonly usageCode = `import {
  NgAtomsAccordionComponent,
  NgAtomsAccordionItemComponent,
  NgAtomsAccordionTriggerDirective,
  NgAtomsAccordionContentDirective,
} from './ui/accordion';

@Component({
  standalone: true,
  imports: [
    NgAtomsAccordionComponent,
    NgAtomsAccordionItemComponent,
    NgAtomsAccordionTriggerDirective,
    NgAtomsAccordionContentDirective,
  ],
  template: \`
    <nga-accordion defaultValue="item-1">
      <nga-accordion-item value="item-1">
        <button ngAtomsAccordionTrigger>Question one</button>
        <div ngAtomsAccordionContent>Answer one.</div>
      </nga-accordion-item>
    </nga-accordion>
  \`,
})
export class MyComponent {}`;

  readonly singleCode = `<nga-accordion defaultValue="what">
  <nga-accordion-item value="what">
    <button ngAtomsAccordionTrigger>What is NgAtoms?</button>
    <div ngAtomsAccordionContent>
      NgAtoms is a collection of Angular UI primitives designed to be
      copied directly into your project. No runtime dependencies.
    </div>
  </nga-accordion-item>
  <nga-accordion-item value="how">
    <button ngAtomsAccordionTrigger>How does it work?</button>
    <div ngAtomsAccordionContent>
      Run ngatoms add accordion and the files are copied into your codebase.
    </div>
  </nga-accordion-item>
</nga-accordion>`;

  readonly multipleCode = `<nga-accordion type="multiple" defaultValue="shipping">
  <nga-accordion-item value="shipping">
    <button ngAtomsAccordionTrigger>Shipping policy</button>
    <div ngAtomsAccordionContent>
      Orders ship within 1–2 business days.
    </div>
  </nga-accordion-item>
  <nga-accordion-item value="returns">
    <button ngAtomsAccordionTrigger>Returns & refunds</button>
    <div ngAtomsAccordionContent>
      Items can be returned within 30 days of delivery.
    </div>
  </nga-accordion-item>
</nga-accordion>`;

  readonly props = [
    { name: 'type',         type: `'single' | 'multiple'`, defaultVal: `'single'`,  description: 'Whether only one or multiple panels can be open at once.' },
    { name: 'collapsible',  type: 'boolean',               defaultVal: 'true',       description: 'When type is single, whether the open panel can be collapsed.' },
    { name: 'defaultValue', type: 'string | string[]',     defaultVal: `''`,         description: 'Panel value(s) open on first render.' },
  ];

  readonly a11yItems = [
    { icon: 'keyboard',    title: 'Keyboard',        body: 'Arrow Up/Down navigate between triggers. Space/Enter toggle the focused panel. Home/End jump to the first/last trigger.' },
    { icon: 'caret-right', title: 'ARIA states',     body: 'aria-expanded on each trigger reflects its open/closed state. The content region has aria-hidden when collapsed.' },
    { icon: 'eye',         title: 'Focus ring',      body: 'Each trigger shows a visible focus indicator on keyboard navigation, suppressed on mouse interactions.' },
  ];

  readonly tocItems = [
    { id: 'usage',    label: 'Usage' },
    { id: 'single',   label: 'Single' },
    { id: 'multiple', label: 'Multiple' },
    { id: 'api',      label: 'API' },
    { id: 'a11y',     label: 'Accessibility' },
  ];
}
