/**
 * @file The area that opens a context menu on right-click, or from the
 * keyboard.
 */

import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgAtomsContextMenuComponent } from './context-menu.component';

/** The area that opens a context menu on right-click, or from the keyboard. */
@Directive({
  selector: '[ngAtomsContextMenuTrigger]',
  standalone: true,
  host: {
    class: 'nga-context-menu-trigger',
    'aria-haspopup': 'menu',
    '[class.nga-context-menu-trigger--open]': 'menu.open()',
  },
})
export class NgAtomsContextMenuTriggerDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly menu = inject(NgAtomsContextMenuComponent);

  /**
   * Set by the key press that precedes a keyboard-invoked `contextmenu`
   * event. Browsers disagree on the coordinates and button they report for
   * that event, so the key press is the only reliable signal.
   */
  private keyboardInvoked = false;

  /**
   * Notes whether the coming `contextmenu` event was produced by the keyboard:
   * the Menu key, or Shift+F10.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    this.keyboardInvoked = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
  }

  /**
   * Opens the menu at the pointer. When the keyboard opened it there is no
   * pointer position, so it is anchored to the trigger and the first item takes
   * focus.
   */
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    const fromKeyboard = this.keyboardInvoked;
    this.keyboardInvoked = false;
    if (this.menu.disabled()) return;
    event.preventDefault();

    if (fromKeyboard) {
      const rect = this.el.nativeElement.getBoundingClientRect();
      this.menu.openAt(
        rect.left + Math.min(rect.width / 2, 24),
        rect.top + Math.min(rect.height / 2, 24),
        true,
      );
      return;
    }
    this.menu.openAt(event.clientX, event.clientY);
  }
}
