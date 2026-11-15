/**
 * @file Dropdown menu: a trigger and a panel of items.
 */

import {
  Component,
  ElementRef,
  HostListener,
  InjectionToken,
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

export type NgAtomsDropdownPlacement = 'top' | 'bottom' | 'left' | 'right';
export type NgAtomsDropdownAlign = 'start' | 'center' | 'end';

export interface NgAtomsDropdownMenuContext {
  open: ReturnType<typeof model<boolean>>;
  close(): void;
  focusFirst(): void;
  focusLast(): void;
  focusNext(current: HTMLElement): void;
  focusPrev(current: HTMLElement): void;
}

export const NGA_DROPDOWN_MENU = new InjectionToken<NgAtomsDropdownMenuContext>('NGA_DROPDOWN_MENU');

const OPPOSITE: Record<NgAtomsDropdownPlacement, NgAtomsDropdownPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Dropdown menu: a trigger and a panel of items. */
@Component({
  selector: 'nga-dropdown-menu',
  standalone: true,
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.css',
  host: { class: 'nga-dropdown-root' },
  providers: [{ provide: NGA_DROPDOWN_MENU, useExisting: NgAtomsDropdownMenuComponent }],
})
export class NgAtomsDropdownMenuComponent implements NgAtomsDropdownMenuContext, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);

  readonly open = model<boolean>(false);
  readonly placement = input<NgAtomsDropdownPlacement>('bottom');
  readonly align = input<NgAtomsDropdownAlign>('start');
  readonly activePlacement = signal<NgAtomsDropdownPlacement>('bottom');

  readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  private deregister: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) this.activePlacement.set(this.placement());
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
    afterNextRender(() => {
      this.renderer.appendChild(this.document.body, this.panelEl().nativeElement);
    });
  }

  /** Keeps the panel by the trigger while the page scrolls. */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.open()) {
      this.position();
    }
  }

  /** Opens the menu with focus on the first item, or closes it. */
  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      requestAnimationFrame(() => {
        this.position();
        this.focusFirst();
      });
    }
  }

  /** Opens the menu with focus on the last item. */
  openAndFocusLast(): void {
    this.open.set(true);
    requestAnimationFrame(() => {
      this.position();
      this.focusLast();
    });
  }

  /** Closes the menu. */
  close(): void {
    this.open.set(false);
  }

  /** The items that can take focus, in order. */
  private items(): HTMLElement[] {
    return Array.from(
      this.panelEl().nativeElement.querySelectorAll<HTMLElement>(
        '.nga-dropdown-item:not([aria-disabled="true"])',
      ),
    );
  }

  /** Focuses the first item. */
  focusFirst(): void {
    this.items()[0]?.focus();
  }

  /** Focuses the last item. */
  focusLast(): void {
    const items = this.items();
    items[items.length - 1]?.focus();
  }

  /** Focuses the item after the given one, wrapping to the first. */
  focusNext(current: HTMLElement): void {
    const items = this.items();
    const idx = items.indexOf(current);
    items[(idx + 1) % items.length]?.focus();
  }

  /** Focuses the item before the given one, wrapping to the last. */
  focusPrev(current: HTMLElement): void {
    const items = this.items();
    const idx = items.indexOf(current);
    items[(idx - 1 + items.length) % items.length]?.focus();
  }

  /**
   * Coordinates of the panel for a placement and an alignment, before
   * any check that it fits the viewport.
   *
   * @param p Side of the trigger the panel opens on.
   * @param a Alignment of the panel along that side.
   * @param tr Bounding box of the trigger.
   * @param pr Bounding box of the panel.
   * @param gap Space between the trigger and the panel, in px.
   * @returns Viewport coordinates of the panel's top-left corner.
   */
  private computeCoords(
    p: NgAtomsDropdownPlacement,
    a: NgAtomsDropdownAlign,
    tr: DOMRect,
    pr: DOMRect,
    gap: number,
  ): { top: number; left: number } {
    if (p === 'left' || p === 'right') {
      const left = p === 'left' ? tr.left - pr.width - gap : tr.right + gap;
      const top =
        a === 'start' ? tr.top :
        a === 'end'   ? tr.bottom - pr.height :
                        tr.top + tr.height / 2 - pr.height / 2;
      return { top, left };
    }

    const top = p === 'bottom' ? tr.bottom + gap : tr.top - pr.height - gap;
    const left =
      a === 'start' ? tr.left :
      a === 'end'   ? tr.right - pr.width :
                      tr.left + tr.width / 2 - pr.width / 2;
    return { top, left };
  }

  /** Whether the panel at these coordinates stays inside the viewport, keeping a margin. */
  private fits(top: number, left: number, pr: DOMRect, margin: number): boolean {
    return (
      top >= margin &&
      left >= margin &&
      top + pr.height <= window.innerHeight - margin &&
      left + pr.width <= window.innerWidth - margin
    );
  }

  /**
   * Places the panel next to the trigger, flipping to the opposite side
   * when it does not fit. When neither side fits, the preferred side is
   * clamped inside the viewport, keeping the margin.
   */
  private position(): void {
    const panel = this.panelEl().nativeElement;
    const tr = this.el.nativeElement.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const gap = 4;
    const margin = 8;
    const p = this.placement();
    const a = this.align();
    const fb = OPPOSITE[p];

    const pc = this.computeCoords(p, a, tr, pr, gap);
    const fc = this.computeCoords(fb, a, tr, pr, gap);

    let resolved: NgAtomsDropdownPlacement;
    let top: number;
    let left: number;

    if (this.fits(pc.top, pc.left, pr, margin)) {
      resolved = p;
      ({ top, left } = pc);
    } else if (this.fits(fc.top, fc.left, pr, margin)) {
      resolved = fb;
      ({ top, left } = fc);
    } else {
      resolved = p;
      top = Math.max(margin, Math.min(pc.top, window.innerHeight - pr.height - margin));
      left = Math.max(margin, Math.min(pc.left, window.innerWidth - pr.width - margin));
    }

    this.activePlacement.set(resolved);
    this.renderer.setStyle(panel, 'top', `${top}px`);
    this.renderer.setStyle(panel, 'left', `${left}px`);
  }

  /** Removes the panel from the body and stops listening for outside clicks. */
  ngOnDestroy(): void {
    this.deregister?.();
    const panel = this.panelEl().nativeElement;
    if (panel.parentElement === this.document.body) {
      this.renderer.removeChild(this.document.body, panel);
    }
  }
}