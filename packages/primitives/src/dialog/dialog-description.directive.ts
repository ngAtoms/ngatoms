/**
 * @file Description of a dialog.
 */

import { Directive } from '@angular/core';

/** Description of a dialog. */
@Directive({
  selector: '[ngAtomsDialogDescription]',
  standalone: true,
  host: { class: 'nga-dialog-description' },
})
export class NgAtomsDialogDescriptionDirective {}
