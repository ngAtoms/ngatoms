/**
 * @file Header of a dialog.
 */

import { Directive } from '@angular/core';

/** Header of a dialog. */
@Directive({
  selector: '[ngAtomsDialogHeader]',
  standalone: true,
  host: { class: 'nga-dialog-header' },
})
export class NgAtomsDialogHeaderDirective {}
