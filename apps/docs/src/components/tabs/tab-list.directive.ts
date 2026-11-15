/**
 * @file The row of tab triggers.
 */

import { Directive } from '@angular/core';

/** The row of tab triggers. */
@Directive({
  selector: '[ngAtomsTabList]',
  standalone: true,
  host: {
    class: 'nga-tab-list',
    role: 'tablist',
  },
})
export class NgAtomsTabListDirective {}
