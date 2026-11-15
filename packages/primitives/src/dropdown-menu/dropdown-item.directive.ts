/**
 * @file One item of a dropdown menu.
 */

import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { NGA_DROPDOWN_MENU } from './dropdown-menu.component';

/** One item of a dropdown menu. */
@Directive({
  selector: '[ngAtomsDropdownItem]',
  standalone: true,
  host: {
    class: 'nga-dropdown-item',
    role: 'menuitem',
    tabindex: '-1',
  },
})
export class NgAtomsDropdownItemDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly menu = inject(NGA_DROPDOWN_MENU);

  readonly disabled = input<boolean>(false);
  readonly destructive = input<boolean>(false);

  constructor() {
    effect(() => {
      if (this.disabled()) {
        this.renderer.setAttribute(this.el.nativeElement, 'aria-disabled', 'true');
        this.renderer.addClass(this.el.nativeElement, 'nga-dropdown-item--disabled');
      } else {
        this.renderer.removeAttribute(this.el.nativeElement, 'aria-disabled');
        this.renderer.removeClass(this.el.nativeElement, 'nga-dropdown-item--disabled');
      }
    });

    effect(() => {
      if (this.destructive()) {
        this.renderer.addClass(this.el.nativeElement, 'nga-dropdown-item--destructive');
      } else {
        this.renderer.removeClass(this.el.nativeElement, 'nga-dropdown-item--destructive');
      }
    });
  }

  /** Hover and keyboard share one highlight: the focused item. */
  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.disabled()) this.el.nativeElement.focus({ preventScroll: true });
  }

  /** Closes the menu after the item was chosen. */
  @HostListener('click')
  onClick(): void {
    if (this.disabled()) return;
    this.menu.close();
  }

  /** Arrow keys, Home and End move between items; Tab closes the menu. */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.menu.focusNext(this.el.nativeElement);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.menu.focusPrev(this.el.nativeElement);
        break;
      case 'Home':
        event.preventDefault();
        this.menu.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.menu.focusLast();
        break;
      case 'Tab':
        this.menu.close();
        break;
    }
  }
}
