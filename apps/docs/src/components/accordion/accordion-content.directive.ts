/**
 * @file Marks the content of an accordion item: the panel that opens and
 * closes.
 */

import { Directive } from '@angular/core';

/** Marks the content of an accordion item: the panel that opens and closes. */
@Directive({
  selector: '[ngAtomsAccordionContent]',
  standalone: true,
  host: { class: 'nga-accordion-content' },
})
export class NgAtomsAccordionContentDirective {}
