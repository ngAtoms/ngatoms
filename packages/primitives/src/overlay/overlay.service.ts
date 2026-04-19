import { Injectable, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

interface OverlayEntry {
  close: () => void;
  contains: HTMLElement[];
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
   * @param closeFn   Called by the service to close the overlay
   *                  (scroll / Escape / click-outside).
   * @param contains  Elements whose subtree, when clicked, should NOT
   *                  close this overlay (e.g. trigger + panel elements).
   * @returns A deregister function — call it when the component closes
   *          itself so the service can remove it from the stack.
   */
  register(closeFn: () => void, ...contains: HTMLElement[]): () => void {
    const entry: OverlayEntry = { close: closeFn, contains };
    this.stack.push(entry);
    if (this.stack.length === 1) {
      this.attachGlobal();
      this.deferTimer = setTimeout(() => this.attachClick(), 0);
    }
    return () => this.deregister(entry);
  }

  private deregister(entry: OverlayEntry): void {
    const idx = this.stack.lastIndexOf(entry);
    if (idx >= 0) this.stack.splice(idx, 1);
    if (!this.stack.length) this.detach();
  }

  private readonly onScroll = (): void => {
    const all = this.stack.splice(0);
    this.detach();
    all.forEach(e => e.close());
  };

  private readonly onEscape = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    const entry = this.stack.pop();
    if (!this.stack.length) this.detach();
    entry?.close();
  };

  private readonly onClick = (e: MouseEvent): void => {
    const target = e.target as Node;
    const toClose = this.stack.filter(
      entry => !entry.contains.some(el => el.contains(target)),
    );
    toClose.forEach(entry => {
      this.deregister(entry);
      entry.close();
    });
  };

  private attachGlobal(): void {
    const win = this.document.defaultView;
    if (!win) return;
    win.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    win.addEventListener('keydown', this.onEscape);
  }

  private attachClick(): void {
    this.deferTimer = null;
    if (!this.stack.length) return;
    this.document.defaultView?.addEventListener('click', this.onClick);
    this.clickAttached = true;
  }

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

  ngOnDestroy(): void {
    this.stack.length = 0;
    this.detach();
  }
}
