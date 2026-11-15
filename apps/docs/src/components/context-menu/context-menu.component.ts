/**
 * @file Closes the menu.
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgAtomsOverlayService } from '../overlay/overlay.service';
import { NGA_DROPDOWN_MENU, NgAtomsDropdownMenuContext } from '../dropdown-menu/dropdown-menu.component';

/**
 * A menu opened by right-click (or Shift+F10 / the Menu key) on its trigger
 * area. Items are the dropdown-menu ones: `ngAtomsDropdownItem`,
 * `ngAtomsDropdownSeparator` and `ngAtomsDropdownLabel`.
 */
@Component({
  selector: 'nga-context-menu',
  standalone: true,
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css',
  host: { class: 'nga-context-menu-root' },
  providers: [{ provide: NGA_DROPDOWN_MENU, useExisting: NgAtomsContextMenuComponent }],
})
export class NgAtomsContextMenuComponent implements NgAtomsDropdownMenuContext, OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);

  readonly open = model<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  private deregister: (() => void) | null = null;
  /** Element focused before the menu opened, so focus can go back to it. */
  private returnFocusTo: HTMLElement | null = null;

  /**
   * Registers the open menu for outside clicks and Escape. On close, focus goes
   * back to where it was only if it was still inside the menu: a click elsewhere
   * keeps the focus the user just chose.
   */
  constructor() {
    effect(() => {
      if (this.open()) {
        this.deregister = this.overlay.register(
          () => this.open.set(false),
          this.panelEl().nativeElement,
        );
      } else {
        this.deregister?.();
        this.deregister = null;
        if (this.panelEl().nativeElement.contains(this.document.activeElement)) {
          this.returnFocusTo?.focus();
        }
        this.returnFocusTo = null;
      }
    });
    afterNextRender(() => {
      this.renderer.appendChild(this.document.body, this.panelEl().nativeElement);
    });
  }

  /**
   * Opens the menu with its top-left corner at the given viewport point.
   * A pointer opens it with nothing highlighted; `focusFirstItem` is for
   * keyboard invocation, where the first item is expected to take focus.
   * The panel is placed before it shows, so it never flashes at its
   * previous spot.
   */
  openAt(x: number, y: number, focusFirstItem = false): void {
    if (this.disabled()) return;
    if (!this.open()) {
      this.returnFocusTo = this.document.activeElement as HTMLElement | null;
    }
    const panel = this.panelEl().nativeElement;
    this.renderer.setStyle(panel, 'top', `${y}px`);
    this.renderer.setStyle(panel, 'left', `${x}px`);

    this.open.set(true);
    requestAnimationFrame(() => {
      this.position(x, y);
      if (focusFirstItem) this.focusFirst();
      else panel.focus({ preventScroll: true });
    });
  }

  /** Arrow keys on the bare panel (nothing highlighted yet) enter the list. */
  onPanelKeydown(event: KeyboardEvent): void {
    if (event.target !== this.panelEl().nativeElement) return;
    if (event.key === 'ArrowDown' || event.key === 'Home') {
      event.preventDefault();
      this.focusFirst();
    } else if (event.key === 'ArrowUp' || event.key === 'End') {
      event.preventDefault();
      this.focusLast();
    } else if (event.key === 'Tab') {
      this.close();
    }
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
   * Places the panel at a point: it flips to the other side of the pointer when
   * it would overflow, and is then kept inside the viewport.
   */
  private position(x: number, y: number): void {
    const panel = this.panelEl().nativeElement;
    const rect = panel.getBoundingClientRect();
    const margin = 8;

    let left = x + rect.width > window.innerWidth - margin ? x - rect.width : x;
    let top = y + rect.height > window.innerHeight - margin ? y - rect.height : y;
    left = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin));

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
