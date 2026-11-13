import { Directive, HostListener, inject } from '@angular/core';
import { NgAtomsDrawerComponent } from './drawer.component';

@Directive({ selector: '[ngAtomsDrawerHeader]', standalone: true, host: { class: 'nga-drawer-header' } })
export class NgAtomsDrawerHeaderDirective {}

@Directive({ selector: '[ngAtomsDrawerTitle]', standalone: true, host: { class: 'nga-drawer-title' } })
export class NgAtomsDrawerTitleDirective {}

@Directive({
  selector: '[ngAtomsDrawerDescription]',
  standalone: true,
  host: { class: 'nga-drawer-description' },
})
export class NgAtomsDrawerDescriptionDirective {}

@Directive({ selector: '[ngAtomsDrawerBody]', standalone: true, host: { class: 'nga-drawer-body' } })
export class NgAtomsDrawerBodyDirective {}

@Directive({ selector: '[ngAtomsDrawerFooter]', standalone: true, host: { class: 'nga-drawer-footer' } })
export class NgAtomsDrawerFooterDirective {}

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

  @HostListener('click')
  onClick(): void {
    this.drawer.closeDrawer();
  }
}
