/**
 * @file A rule between groups of items.
 */

import { Directive } from '@angular/core';

/** A rule between groups of items. */
@Directive({
  selector: '[ngAtomsDropdownSeparator]',
  standalone: true,
  host: {
    class: 'nga-dropdown-separator',
    role: 'separator',
    'aria-orientation': 'horizontal',
  },
})
export class NgAtomsDropdownSeparatorDirective {}
