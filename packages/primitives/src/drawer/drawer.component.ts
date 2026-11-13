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

  constructor() {
    effect(() => {
      const el = this.dialogEl().nativeElement;
      if (this.open()) {
        if (!el.open) {
          el.showModal();
          // showModal() focuses the first control, which lights up its focus
          // ring before the user has done anything. Start on the panel instead;
          // Tab still goes to the first control.
          this.panelEl().nativeElement.focus({ preventScroll: true });
        }
      } else {
        if (el.open) el.close();
      }
    });
  }

  closeDrawer(): void {
    this.open.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.dismissible() && event.target === this.dialogEl().nativeElement) {
      this.closeDrawer();
    }
  }

  ngOnDestroy(): void {
    const el = this.dialogEl()?.nativeElement;
    if (el?.open) el.close();
  }
}
