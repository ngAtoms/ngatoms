/**
 * @file Footer of a dialog, usually its actions.
 */

import { Directive } from '@angular/core';

/** Footer of a dialog, usually its actions. */
@Directive({
  selector: '[ngAtomsDialogFooter]',
  standalone: true,
  host: { class: 'nga-dialog-footer' },
})
export class NgAtomsDialogFooterDirective {}
