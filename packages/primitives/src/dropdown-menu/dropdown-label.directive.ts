/**
 * @file A heading for a group of items; it cannot be chosen.
 */

import { Directive } from '@angular/core';

/** A heading for a group of items; it cannot be chosen. */
@Directive({
  selector: '[ngAtomsDropdownLabel]',
  standalone: true,
  host: { class: 'nga-dropdown-label' },
})
export class NgAtomsDropdownLabelDirective {}
