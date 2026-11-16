/**
 * @file One set of global listeners shared by every open overlay: outside
 * clicks, Escape and scrolling.
 */

import { Injectable, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Why the service is closing an overlay. */
export type NgAtomsOverlayCloseReason = 'escape' | 'outside' | 'scroll';

interface OverlayEntry {
  close: (reason: NgAtomsOverlayCloseReason) => void;
  contains: HTMLElement[];
  closeOnScroll?: boolean;
}

/**
 * Centralises global event handling for all overlay-based primitives
 * (popover, dropdown-menu, select). Attaches a single set of listeners
 * only while at least one overlay is open, and detaches them when none
 * remain. Escape closes the most-recently-opened overlay; scroll closes
 * all overlays.
 */
@Injectable({ providedIn: 'root' })
export class NgAtomsOverlayService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly stack: OverlayEntry[] = [];
  private clickAttached = false;
  private deferTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Register an open overlay.
   *
   * @param closeFn         Called by the service to close the overlay, with
   *                        the reason: scroll, Escape or a click outside.
   *                        Escape is the one case where focus should go
   *                        back to the trigger.
   * @param contains        Elements whose subtree, when clicked, should NOT
   *                        close this overlay (e.g. trigger + panel elements).
   * @param options.closeOnScroll Whether to close the overlay when the user scrolls.
   * @returns A deregister function — call it when the component closes
   *          itself so the service can remove it from the stack.
   */
  register(
    closeFn: (reason: NgAtomsOverlayCloseReason) => void,
    contains: HTMLElement | HTMLElement[],
    options: { closeOnScroll?: boolean } = {}
  ): () => void {
    const elements = Array.isArray(contains) ? contains : [contains];
    const entry: OverlayEntry = {
      close: closeFn,
      contains: elements,
      closeOnScroll: options.closeOnScroll ?? true
    };
    this.stack.push(entry);
    if (this.stack.length === 1) {
      this.attachGlobal();
      this.deferTimer = setTimeout(() => this.attachClick(), 0);
    }
    return () => this.deregister(entry);
  }

  /** Takes an overlay off the stack, and stops listening when it was the last. */
  private deregister(entry: OverlayEntry): void {
    const idx = this.stack.lastIndexOf(entry);
    if (idx >= 0) this.stack.splice(idx, 1);
    if (!this.stack.length) this.detach();
  }

  /** Closes the overlays that asked to close on scroll, after taking them off the stack. */
  private readonly onScroll = (): void => {
    const toClose = this.stack.filter(e => e.closeOnScroll);

    toClose.forEach(entry => {
      const idx = this.stack.indexOf(entry);
      if (idx >= 0) this.stack.splice(idx, 1);
    });

    if (!this.stack.length) this.detach();
    toClose.forEach(e => e.close('scroll'));
  };

  /**
   * Closes the overlay opened last when Escape is pressed, and cancels the
   * key so a modal dialog around the overlay stays open. An Escape that a
   * component already handled is left alone.
   */
  private readonly onEscape = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const entry = this.stack.pop();
    if (!this.stack.length) this.detach();
    if (!entry) return;
    e.preventDefault();
    entry.close('escape');
  };

  /** Closes every overlay the click landed outside of. */
  private readonly onClick = (e: MouseEvent): void => {
    const target = e.target as Node;
    const toClose = this.stack.filter(
      entry => !entry.contains.some(el => el.contains(target)),
    );
    toClose.forEach(entry => {
      this.deregister(entry);
      entry.close('outside');
    });
  };

  /** Starts listening for scrolling and Escape. */
  private attachGlobal(): void {
    const win = this.document.defaultView;
    if (!win) return;
    win.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    win.addEventListener('keydown', this.onEscape);
  }

  /**
   * Starts listening for clicks. Deferred by a tick, so the click that opened an
   * overlay does not close it.
   */
  private attachClick(): void {
    this.deferTimer = null;
    if (!this.stack.length) return;
    this.document.defaultView?.addEventListener('click', this.onClick);
    this.clickAttached = true;
  }

  /** Stops listening for everything. */
  private detach(): void {
    const win = this.document.defaultView;
    if (!win) return;
    win.removeEventListener('scroll', this.onScroll, true);
    win.removeEventListener('keydown', this.onEscape);
    if (this.clickAttached) {
      win.removeEventListener('click', this.onClick);
      this.clickAttached = false;
    }
    if (this.deferTimer !== null) {
      clearTimeout(this.deferTimer);
      this.deferTimer = null;
    }
  }

  /** Empties the stack and stops listening. */
  ngOnDestroy(): void {
    this.stack.length = 0;
    this.detach();
  }
}
