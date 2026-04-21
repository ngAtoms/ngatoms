import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NgAtomsAlertDirective,
  NgAtomsAlertTitleDirective,
  NgAtomsAlertDescriptionDirective,
} from '../../../components/alert';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const VARIANTS = ['default', 'info', 'success', 'warning', 'destructive'] as const;
type Variant = typeof VARIANTS[number];

const VARIANT_META: Record<Variant, { icon: string; title: string; description: string }> = {
  default:     { icon: 'ph-bold ph-bell',         title: 'Heads up',             description: 'You can add components to your app using the CLI.' },
  info:        { icon: 'ph-bold ph-info',          title: 'New version available', description: 'Version 2.0 includes breaking changes. Review the migration guide.' },
  success:     { icon: 'ph-bold ph-check-circle',  title: 'Deployment successful', description: 'Your changes have been deployed to production.' },
  warning:     { icon: 'ph-bold ph-warning',       title: 'Unsaved changes',       description: 'You have unsaved changes. They will be lost if you navigate away.' },
  destructive: { icon: 'ph-bold ph-x-circle',      title: 'Action required',       description: 'Your account will be deactivated in 24 hours. Please verify your email.' },
};

@Component({
  selector: 'app-alert-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsAlertDirective,
    NgAtomsAlertTitleDirective,
    NgAtomsAlertDescriptionDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './alert-page.component.html',
  styleUrl: './alert-page.component.css',
})
export class AlertPageComponent {
  readonly variants = VARIANTS;
  readonly meta = VARIANT_META;

  readonly heroCode = `<div ngAtomsAlert variant="info">
  <i class="ph-bold ph-info"></i>
  <div>
    <p ngAtomsAlertTitle>New version available</p>
    <p ngAtomsAlertDescription>Version 2.0 includes breaking changes. Review the migration guide.</p>
  </div>
</div>`;

  readonly usageCode = `import { NgAtomsAlertDirective, NgAtomsAlertTitleDirective, NgAtomsAlertDescriptionDirective } from './ui/alert';

@Component({
  standalone: true,
  imports: [NgAtomsAlertDirective, NgAtomsAlertTitleDirective, NgAtomsAlertDescriptionDirective],
  template: \`
    <div ngAtomsAlert variant="success">
      <i class="ph-bold ph-check-circle"></i>
      <div>
        <p ngAtomsAlertTitle>Changes saved</p>
        <p ngAtomsAlertDescription>Your profile has been updated successfully.</p>
      </div>
    </div>
  \`,
})
export class MyComponent {}`;

  readonly variantsCode = `<div ngAtomsAlert variant="default">
  <i class="ph-bold ph-bell"></i>
  <div>
    <p ngAtomsAlertTitle>Heads up</p>
    <p ngAtomsAlertDescription>You can add components to your app using the CLI.</p>
  </div>
</div>

<div ngAtomsAlert variant="info">
  <i class="ph-bold ph-info"></i>
  <div>
    <p ngAtomsAlertTitle>New version available</p>
    <p ngAtomsAlertDescription>Version 2.0 includes breaking changes. Review the migration guide.</p>
  </div>
</div>

<div ngAtomsAlert variant="success">
  <i class="ph-bold ph-check-circle"></i>
  <div>
    <p ngAtomsAlertTitle>Deployment successful</p>
    <p ngAtomsAlertDescription>Your changes have been deployed to production.</p>
  </div>
</div>

<div ngAtomsAlert variant="warning">
  <i class="ph-bold ph-warning"></i>
  <div>
    <p ngAtomsAlertTitle>Unsaved changes</p>
    <p ngAtomsAlertDescription>You have unsaved changes. They will be lost if you navigate away.</p>
  </div>
</div>

<div ngAtomsAlert variant="destructive">
  <i class="ph-bold ph-x-circle"></i>
  <div>
    <p ngAtomsAlertTitle>Action required</p>
    <p ngAtomsAlertDescription>Your account will be deactivated in 24 hours. Please verify your email.</p>
  </div>
</div>`;

  readonly inlineCode = `<!-- Omit description for compact single-line alerts -->
<div ngAtomsAlert variant="info">
  <i class="ph-bold ph-info"></i>
  <p ngAtomsAlertTitle>New version available</p>
</div>`;

  readonly props = [
    {
      name: 'variant',
      type: `'default' | 'info' | 'success' | 'warning' | 'destructive'`,
      defaultVal: `'default'`,
      description: 'Visual style and semantic meaning of the alert.',
    },
  ];

  readonly a11yItems = [
    { icon: 'speaker-high', title: 'Live regions',   body: 'For alerts that appear dynamically, add role="alert" or aria-live="polite" to announce to screen readers immediately.' },
    { icon: 'palette',      title: 'Color + icon',   body: 'Each variant uses both color and a distinct icon to convey meaning, ensuring accessibility for users with color vision deficiencies.' },
    { icon: 'eye',          title: 'Focus',          body: 'Alerts are non-interactive and do not receive focus by default. Place actionable links or buttons inside the description if a response is needed.' },
  ];

  readonly tocItems = [
    { id: 'usage',    label: 'Usage' },
    { id: 'variants', label: 'Variants' },
    { id: 'inline',   label: 'Without description' },
    { id: 'api',      label: 'API' },
    { id: 'a11y',     label: 'Accessibility' },
  ];
}
