/**
 * @file Title of a dialog.
 */

import { Directive } from '@angular/core';

/** Title of a dialog. */
@Directive({
  selector: '[ngAtomsDialogTitle]',
  standalone: true,
  host: { class: 'nga-dialog-title' },
})
export class NgAtomsDialogTitleDirective {}
