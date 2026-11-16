/**
 * @file Popover: a floating panel anchored to a trigger.
 */

import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
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
import { hideFromTopLayer, placeFixed, prepareTopLayer, showInTopLayer } from '../overlay/top-layer';
import { NgAtomsOverlayPlacement, computeOverlayPosition } from '../overlay/position';

export type NgAtomsPopoverPlacement = NgAtomsOverlayPlacement;

/** Popover: a floating panel anchored to a trigger. */
@Component({
  selector: 'nga-popover',
  standalone: true,
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.css',
  host: { class: 'nga-popover-root' },
})
export class NgAtomsPopoverComponent implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);

  readonly open = model<boolean>(false);
  readonly placement = input<NgAtomsPopoverPlacement>('bottom');

  readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  readonly activePlacement = signal<NgAtomsPopoverPlacement>('bottom');

  private deregister: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      prepareTopLayer(this.panelEl().nativeElement);
    });
    effect(() => {
      if (this.open()) {
        showInTopLayer(this.panelEl().nativeElement);
        this.deregister = this.overlay.register(
          () => this.open.set(false),
          [this.el.nativeElement, this.panelEl().nativeElement],
          { closeOnScroll: false }
        );
      } else {
        hideFromTopLayer(this.panelEl().nativeElement);
        this.deregister?.();
        this.deregister = null;
      }
    });
  }

  /** Keeps the panel by the trigger while the page scrolls. */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.open()) {
      this.position();
    }
  }

  /** Opens or closes the panel. */
  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      requestAnimationFrame(() => this.position());
    }
  }

  /** Closes the panel. */
  close(): void {
    this.open.set(false);
  }

  /**
   * Places the panel next to the trigger, flipping to the opposite side
   * when it does not fit. When neither side fits, the preferred side is
   * clamped inside the viewport, keeping the margin.
   */
  private position(): void {
    const panel = this.panelEl().nativeElement;
    const pos = computeOverlayPosition(
      this.el.nativeElement.getBoundingClientRect(),
      panel.getBoundingClientRect(),
      { placement: this.placement(), gap: 8, margin: 8 },
    );

    this.activePlacement.set(pos.placement);
    placeFixed(panel, pos.top, pos.left);
  }

  /** Stops listening for outside clicks, Escape and scrolling. */
  ngOnDestroy(): void {
    this.deregister?.();
  }
}
