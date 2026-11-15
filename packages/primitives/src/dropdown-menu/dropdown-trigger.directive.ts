/**
 * @file The button that opens a dropdown menu.
 */

import { Directive, HostListener, inject } from '@angular/core';
import { NgAtomsDropdownMenuComponent } from './dropdown-menu.component';

/** The button that opens a dropdown menu. */
@Directive({
  selector: '[ngAtomsDropdownTrigger]',
  standalone: true,
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu.open()',
    '[class.nga-dropdown-trigger--open]': 'menu.open()',
  },
})
export class NgAtomsDropdownTriggerDirective {
  readonly menu = inject(NgAtomsDropdownMenuComponent);

  /** Opens or closes the menu. */
  @HostListener('click')
  onClick(): void {
    this.menu.toggle();
  }

  /**
   * Arrow Down opens the menu on its first item and Arrow Up on its last; with
   * the menu open they move focus there.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.menu.open()) {
        this.menu.toggle();
      } else {
        this.menu.focusFirst();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.menu.open()) {
        this.menu.openAndFocusLast();
      } else {
        this.menu.focusLast();
      }
    }
  }
}
