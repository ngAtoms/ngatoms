/**
 * @file Breadcrumb: the landmark, the list, its entries, links, separators
 * and the ellipsis.
 */

import { Directive, input } from '@angular/core';

/** Breadcrumb navigation landmark. */
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

/** The ordered list of a breadcrumb. */
@Directive({ selector: '[ngAtomsBreadcrumbList]', standalone: true, host: { class: 'nga-breadcrumb-list' } })
export class NgAtomsBreadcrumbListDirective {}

/** One entry of a breadcrumb. */
@Directive({ selector: '[ngAtomsBreadcrumbItem]', standalone: true, host: { class: 'nga-breadcrumb-item' } })
export class NgAtomsBreadcrumbItemDirective {}

/** A link to an ancestor page. */
@Directive({ selector: '[ngAtomsBreadcrumbLink]', standalone: true, host: { class: 'nga-breadcrumb-link' } })
export class NgAtomsBreadcrumbLinkDirective {}

/** The current page: the last entry, which is not a link. */
@Directive({
  selector: '[ngAtomsBreadcrumbPage]',
  standalone: true,
  host: { class: 'nga-breadcrumb-page', 'aria-current': 'page' },
})
export class NgAtomsBreadcrumbPageDirective {}

/** Separator between two entries, hidden from assistive technology. */
@Directive({
  selector: '[ngAtomsBreadcrumbSeparator]',
  standalone: true,
  host: { class: 'nga-breadcrumb-separator', role: 'presentation', 'aria-hidden': 'true' },
})
export class NgAtomsBreadcrumbSeparatorDirective {}

/** Stands in for entries that were collapsed. */
@Directive({
  selector: '[ngAtomsBreadcrumbEllipsis]',
  standalone: true,
  host: { class: 'nga-breadcrumb-ellipsis', role: 'presentation', 'aria-hidden': 'true' },
})
export class NgAtomsBreadcrumbEllipsisDirective {}
