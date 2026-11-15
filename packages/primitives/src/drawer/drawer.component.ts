/**
 * @file Side panel on the native `<dialog>` element, sliding in from one of
 * four sides.
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

export type NgAtomsDrawerSide = 'left' | 'right' | 'top' | 'bottom';
export type NgAtomsDrawerSize = 'sm' | 'md' | 'lg' | 'full';

/** Side panel on the native `<dialog>` element, sliding in from one of four sides. */
@Component({
  selector: 'nga-drawer',
  standalone: true,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.css',
  host: { class: 'nga-drawer-root' },
})
export class NgAtomsDrawerComponent implements OnDestroy {
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  readonly open = model<boolean>(false);
  readonly side = input<NgAtomsDrawerSide>('right');
  readonly size = input<NgAtomsDrawerSize>('md');
  /** Close when the backdrop is clicked. */
  readonly dismissible = input<boolean>(true);
  /** Accessible name of the dialog. */
  readonly label = input<string>('');

  /**
   * Opens and closes the native dialog with `open`. `showModal()` focuses the
   * first control, which would light up its focus ring before the user has done
   * anything, so focus starts on the panel instead; Tab still goes to the first
   * control.
   */
  constructor() {
    effect(() => {
      const el = this.dialogEl().nativeElement;
      if (this.open()) {
        if (!el.open) {
          el.showModal();
          this.panelEl().nativeElement.focus({ preventScroll: true });
        }
      } else {
        if (el.open) el.close();
      }
    });
  }

  /** Closes the drawer. */
  closeDrawer(): void {
    this.open.set(false);
  }

  /** Closes the drawer when the backdrop itself is clicked, not the panel. */
  onBackdropClick(event: MouseEvent): void {
    if (this.dismissible() && event.target === this.dialogEl().nativeElement) {
      this.closeDrawer();
    }
  }

  /** Closes the native dialog if it is still open. */
  ngOnDestroy(): void {
    const el = this.dialogEl()?.nativeElement;
    if (el?.open) el.close();
  }
}
