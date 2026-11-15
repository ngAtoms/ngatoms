/**
 * @file Modal dialog on the native `<dialog>` element.
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';

export type NgAtomsDialogSize = 'sm' | 'md' | 'lg' | 'xl';

/** Modal dialog on the native `<dialog>` element. */
@Component({
  selector: 'nga-dialog',
  standalone: true,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css',
  host: { class: 'nga-dialog-root' },
})
export class NgAtomsDialogComponent implements OnDestroy {
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  readonly open = model<boolean>(false);
  readonly size = input<NgAtomsDialogSize>('md');

  constructor() {
    effect(() => {
      const el = this.dialogEl().nativeElement;
      if (this.open()) {
        if (!el.open) el.showModal();
      } else {
        if (el.open) el.close();
      }
    });
  }

  /** Closes the dialog. */
  closeDialog(): void {
    this.open.set(false);
  }

  /** Closes the dialog when the backdrop itself is clicked, not its content. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) {
      this.closeDialog();
    }
  }

  /** Closes the native dialog if it is still open. */
  ngOnDestroy(): void {
    const el = this.dialogEl()?.nativeElement;
    if (el?.open) el.close();
  }
}
