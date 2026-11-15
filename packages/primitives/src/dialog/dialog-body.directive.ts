/**
 * @file Scrollable body of a dialog.
 */

import { Directive } from '@angular/core';

/** Scrollable body of a dialog. */
@Directive({
  selector: '[ngAtomsDialogBody]',
  standalone: true,
  host: { class: 'nga-dialog-body' },
})
export class NgAtomsDialogBodyDirective {}
