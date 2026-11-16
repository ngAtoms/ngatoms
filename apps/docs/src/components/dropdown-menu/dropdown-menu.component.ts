/**
 * @file Dropdown menu: a trigger and a panel of items.
 */

import {
  Component,
  ElementRef,
  HostListener,
  InjectionToken,
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
import {
  NgAtomsOverlayAlign,
  NgAtomsOverlayPlacement,
  computeOverlayPosition,
} from '../overlay/position';

export type NgAtomsDropdownPlacement = NgAtomsOverlayPlacement;
export type NgAtomsDropdownAlign = NgAtomsOverlayAlign;

export interface NgAtomsDropdownMenuContext {
  open: ReturnType<typeof model<boolean>>;
  close(): void;
  focusFirst(): void;
  focusLast(): void;
  focusNext(current: HTMLElement): void;
  focusPrev(current: HTMLElement): void;
}

export const NGA_DROPDOWN_MENU = new InjectionToken<NgAtomsDropdownMenuContext>('NGA_DROPDOWN_MENU');

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
    afterNextRender(() => {
      prepareTopLayer(this.panelEl().nativeElement);
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
   * Places the panel next to the trigger, flipping to the opposite side
   * when it does not fit. When neither side fits, the preferred side is
   * clamped inside the viewport, keeping the margin.
   */
  private position(): void {
    const panel = this.panelEl().nativeElement;
    const pos = computeOverlayPosition(
      this.el.nativeElement.getBoundingClientRect(),
      panel.getBoundingClientRect(),
      { placement: this.placement(), align: this.align(), gap: 4, margin: 8 },
    );

    this.activePlacement.set(pos.placement);
    placeFixed(panel, pos.top, pos.left);
  }

  /** Stops listening for outside clicks, Escape and scrolling. */
  ngOnDestroy(): void {
    this.deregister?.();
  }
}