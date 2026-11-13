import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgAtomsOverlayService } from '../overlay/overlay.service';
import { NgAtomsOverlayPlacement, computeOverlayPosition } from '../overlay/position';

export type NgAtomsPopoverPlacement = NgAtomsOverlayPlacement;

@Component({
  selector: 'nga-popover',
  standalone: true,
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.css',
  host: { class: 'nga-popover-root' },
})
export class NgAtomsPopoverComponent implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);

  readonly open = model<boolean>(false);
  readonly placement = input<NgAtomsPopoverPlacement>('bottom');

  readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  readonly activePlacement = signal<NgAtomsPopoverPlacement>('bottom');

  private deregister: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      this.renderer.appendChild(this.document.body, this.panelEl().nativeElement);
    });
    effect(() => {
      if (this.open()) {
        this.deregister = this.overlay.register(
          () => this.open.set(false),
          [this.el.nativeElement, this.panelEl().nativeElement],
          { closeOnScroll: false }
        );
      } else {
        this.deregister?.();
        this.deregister = null;
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.open()) {
      this.position();
    }
  }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      requestAnimationFrame(() => this.position());
    }
  }

  close(): void {
    this.open.set(false);
  }

  private position(): void {
    const panel = this.panelEl().nativeElement;
    const pos = computeOverlayPosition(
      this.el.nativeElement.getBoundingClientRect(),
      panel.getBoundingClientRect(),
      { placement: this.placement(), gap: 8, margin: 8 },
    );

    this.activePlacement.set(pos.placement);
    this.renderer.setStyle(panel, 'top', `${pos.top}px`);
    this.renderer.setStyle(panel, 'left', `${pos.left}px`);
  }

  ngOnDestroy(): void {
    this.deregister?.();
    const panel = this.panelEl().nativeElement;
    if (panel.parentElement === this.document.body) {
      this.renderer.removeChild(this.document.body, panel);
    }
  }
}
