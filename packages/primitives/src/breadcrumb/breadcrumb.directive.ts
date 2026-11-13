import { Directive, input } from '@angular/core';

@Directive({
  selector: '[ngAtomsBreadcrumb]',
  standalone: true,
  host: {
    class: 'nga-breadcrumb',
    '[attr.aria-label]': 'label()',
  },
})
export class NgAtomsBreadcrumbDirective {
  /** Accessible name of the navigation landmark. */
  readonly label = input<string>('Breadcrumb');
}

@Directive({ selector: '[ngAtomsBreadcrumbList]', standalone: true, host: { class: 'nga-breadcrumb-list' } })
export class NgAtomsBreadcrumbListDirective {}

@Directive({ selector: '[ngAtomsBreadcrumbItem]', standalone: true, host: { class: 'nga-breadcrumb-item' } })
export class NgAtomsBreadcrumbItemDirective {}

@Directive({ selector: '[ngAtomsBreadcrumbLink]', standalone: true, host: { class: 'nga-breadcrumb-link' } })
export class NgAtomsBreadcrumbLinkDirective {}

@Directive({
  selector: '[ngAtomsBreadcrumbPage]',
  standalone: true,
  host: { class: 'nga-breadcrumb-page', 'aria-current': 'page' },
})
export class NgAtomsBreadcrumbPageDirective {}

@Directive({
  selector: '[ngAtomsBreadcrumbSeparator]',
  standalone: true,
  host: { class: 'nga-breadcrumb-separator', role: 'presentation', 'aria-hidden': 'true' },
})
export class NgAtomsBreadcrumbSeparatorDirective {}

@Directive({
  selector: '[ngAtomsBreadcrumbEllipsis]',
  standalone: true,
  host: { class: 'nga-breadcrumb-ellipsis', role: 'presentation', 'aria-hidden': 'true' },
})
export class NgAtomsBreadcrumbEllipsisDirective {}
