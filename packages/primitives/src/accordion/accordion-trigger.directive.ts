/**
 * @file The button that opens and closes its accordion item.
 */

import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  effect,
  inject,
} from '@angular/core';
import { NgAtomsAccordionItemComponent } from './accordion-item.component';

/** The button that opens and closes its accordion item. */
@Directive({
  selector: '[ngAtomsAccordionTrigger]',
  standalone: true,
  host: {
    class: 'nga-accordion-trigger',
    type: 'button',
  },
})
export class NgAtomsAccordionTriggerDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly item = inject(NgAtomsAccordionItemComponent);

  constructor() {
    effect(() => {
      const open = this.item.isOpen();
      this.renderer.setAttribute(this.el.nativeElement, 'aria-expanded', String(open));
      if (open) {
        this.renderer.addClass(this.el.nativeElement, 'nga-accordion-trigger--open');
      } else {
        this.renderer.removeClass(this.el.nativeElement, 'nga-accordion-trigger--open');
      }
    });
  }

  /** Toggles the item. */
  @HostListener('click')
  onClick(): void {
    this.item.toggle();
  }

  /** Enter and Space toggle the panel. */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.item.toggle();
    }
  }

}
