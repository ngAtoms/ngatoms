import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsTabsComponent } from '../../../components/tabs/tabs.component';
import { NgAtomsTabListDirective } from '../../../components/tabs/tab-list.directive';
import { NgAtomsTabTriggerDirective } from '../../../components/tabs/tab-trigger.directive';
import { NgAtomsTabPanelDirective } from '../../../components/tabs/tab-panel.directive';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-tabs-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsTabsComponent,
    NgAtomsTabListDirective,
    NgAtomsTabTriggerDirective,
    NgAtomsTabPanelDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './tabs-page.component.html',
  styleUrl: './tabs-page.component.css',
})
export class TabsPageComponent {
  readonly heroCode = `<nga-tabs defaultValue="account">
  <div ngAtomsTabList>
    <button ngAtomsTabTrigger value="account">Account</button>
    <button ngAtomsTabTrigger value="security">Security</button>
    <button ngAtomsTabTrigger value="billing">Billing</button>
  </div>
  <div ngAtomsTabPanel value="account">Account content.</div>
  <div ngAtomsTabPanel value="security">Security content.</div>
  <div ngAtomsTabPanel value="billing">Billing content.</div>
</nga-tabs>`;

  readonly usageCode = `import { NgAtomsTabsComponent, NgAtomsTabListDirective,
         NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective } from './ui/tabs';

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective,
            NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: \`
    <nga-tabs defaultValue="tab1">
      <div ngAtomsTabList>
        <button ngAtomsTabTrigger value="tab1">Tab 1</button>
        <button ngAtomsTabTrigger value="tab2">Tab 2</button>
      </div>
      <div ngAtomsTabPanel value="tab1">Content 1</div>
      <div ngAtomsTabPanel value="tab2">Content 2</div>
    </nga-tabs>
  \`,
})
export class MyComponent {}`;

  readonly underlineCode = `<nga-tabs defaultValue="account">
  <div ngAtomsTabList>
    <button ngAtomsTabTrigger value="account">Account</button>
    <button ngAtomsTabTrigger value="security">Security</button>
    <button ngAtomsTabTrigger value="notifications">Notifications</button>
    <button ngAtomsTabTrigger value="billing" disabled>Billing</button>
  </div>
  <div ngAtomsTabPanel value="account">Account settings content.</div>
  <div ngAtomsTabPanel value="security">Security settings content.</div>
  <div ngAtomsTabPanel value="notifications">Notification preferences.</div>
</nga-tabs>`;

  readonly pillsCode = `<nga-tabs defaultValue="overview" variant="pills">
  <div ngAtomsTabList>
    <button ngAtomsTabTrigger value="overview">Overview</button>
    <button ngAtomsTabTrigger value="analytics">Analytics</button>
    <button ngAtomsTabTrigger value="reports">Reports</button>
  </div>
  <div ngAtomsTabPanel value="overview">Overview content.</div>
  <div ngAtomsTabPanel value="analytics">Analytics content.</div>
  <div ngAtomsTabPanel value="reports">Reports content.</div>
</nga-tabs>`;

  readonly props = [
    { name: 'defaultValue', type: 'string',                   defaultVal: '—',           description: 'The value of the tab that is active on initial render.' },
    { name: 'value',        type: 'string',                   defaultVal: '—',           description: 'Controlled active tab value. Use with (valueChange) for two-way binding.' },
    { name: 'variant',      type: `'underline' | 'pills'`,    defaultVal: `'underline'`, description: 'Visual style of the tab list.' },
  ];

  readonly a11yItems = [
    { icon: 'tabs',     title: 'ARIA roles',    body: 'role="tablist", role="tab", and role="tabpanel" are set automatically. aria-selected and aria-controls wire each trigger to its panel.' },
    { icon: 'keyboard', title: 'Keyboard',      body: 'Arrow Left / Right moves focus between tabs. Home / End jump to the first or last tab. Space or Enter activates a focused tab.' },
    { icon: 'eye-slash', title: 'Hidden panels', body: 'Inactive panels are hidden with aria-hidden="true" so screen readers only announce the visible panel content.' },
  ];

  readonly tocItems = [
    { id: 'usage',     label: 'Usage' },
    { id: 'underline', label: 'Underline' },
    { id: 'pills',     label: 'Pills' },
    { id: 'api',       label: 'API' },
    { id: 'a11y',      label: 'Accessibility' },
  ];
}
