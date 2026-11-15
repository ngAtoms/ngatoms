/**
 * @file Card: the container and its header, title, description, content and
 * footer.
 */

import { Directive } from '@angular/core';

/** Card container. */
@Directive({ selector: '[ngAtomsCard]', standalone: true, host: { class: 'nga-card' } })
export class NgAtomsCardDirective {}

/** Header of a card. */
@Directive({ selector: '[ngAtomsCardHeader]', standalone: true, host: { class: 'nga-card-header' } })
export class NgAtomsCardHeaderDirective {}

/** Title of a card. */
@Directive({ selector: '[ngAtomsCardTitle]', standalone: true, host: { class: 'nga-card-title' } })
export class NgAtomsCardTitleDirective {}

/** Description of a card. */
@Directive({ selector: '[ngAtomsCardDescription]', standalone: true, host: { class: 'nga-card-description' } })
export class NgAtomsCardDescriptionDirective {}

/** Main content of a card. */
@Directive({ selector: '[ngAtomsCardContent]', standalone: true, host: { class: 'nga-card-content' } })
export class NgAtomsCardContentDirective {}

/** Footer of a card. */
@Directive({ selector: '[ngAtomsCardFooter]', standalone: true, host: { class: 'nga-card-footer' } })
export class NgAtomsCardFooterDirective {}
