/**
 * @file Closes the dialog it is in when clicked.
 */

import { Directive, HostListener, inject } from '@angular/core';
import { NgAtomsDialogComponent } from './dialog.component';

/** Closes the dialog it is in when clicked. */
@Directive({
  selector: '[ngAtomsDialogClose]',
  standalone: true,
  host: {
    class: 'nga-dialog-close',
    type: 'button',
    'aria-label': 'Close dialog',
  },
})
export class NgAtomsDialogCloseDirective {
  private readonly dialog = inject(NgAtomsDialogComponent);

  /** Closes the dialog. */
  @HostListener('click')
  onClick(): void {
    this.dialog.closeDialog();
  }
}
