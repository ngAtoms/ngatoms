/**
 * @file The parts of a drawer: header, title, description, body, footer and
 * close button.
 */

import { Directive, HostListener, inject } from '@angular/core';
import { NgAtomsDrawerComponent } from './drawer.component';

/** Header of a drawer. */
@Directive({ selector: '[ngAtomsDrawerHeader]', standalone: true, host: { class: 'nga-drawer-header' } })
export class NgAtomsDrawerHeaderDirective {}

/** Title of a drawer. */
@Directive({ selector: '[ngAtomsDrawerTitle]', standalone: true, host: { class: 'nga-drawer-title' } })
export class NgAtomsDrawerTitleDirective {}

/** Description of a drawer. */
@Directive({
  selector: '[ngAtomsDrawerDescription]',
  standalone: true,
  host: { class: 'nga-drawer-description' },
})
export class NgAtomsDrawerDescriptionDirective {}

/** Scrollable body of a drawer. */
@Directive({ selector: '[ngAtomsDrawerBody]', standalone: true, host: { class: 'nga-drawer-body' } })
export class NgAtomsDrawerBodyDirective {}

/** Footer of a drawer, usually its actions. */
@Directive({ selector: '[ngAtomsDrawerFooter]', standalone: true, host: { class: 'nga-drawer-footer' } })
export class NgAtomsDrawerFooterDirective {}

/** Closes the drawer it is in when clicked. */
@Directive({
  selector: '[ngAtomsDrawerClose]',
  standalone: true,
  host: {
    class: 'nga-drawer-close',
    type: 'button',
    'aria-label': 'Close drawer',
  },
})
export class NgAtomsDrawerCloseDirective {
  private readonly drawer = inject(NgAtomsDrawerComponent);

  /** Closes the drawer. */
  @HostListener('click')
  onClick(): void {
    this.drawer.closeDrawer();
  }
}
