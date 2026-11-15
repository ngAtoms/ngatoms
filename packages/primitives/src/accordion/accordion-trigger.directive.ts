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

  /**
   * Enter and Space toggle the panel. Arrow Down and Arrow Up move to
   * the next and previous trigger of the same accordion, Home and End
   * to the first and last (Fn+← and Fn+→ on a Mac).
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.item.toggle();
      return;
    }
    const triggers = this.siblingTriggers();
    const index = triggers.indexOf(this.el.nativeElement);
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: triggers.length - 1,
    };
    const target = triggers[targets[event.key]];
    if (index < 0 || !(event.key in targets)) return;
    event.preventDefault();
    target?.focus();
  }

  /** The enabled triggers of the accordion this one belongs to, in document order. */
  private siblingTriggers(): HTMLElement[] {
    const root = (this.el.nativeElement as HTMLElement).closest('.nga-accordion');
    const all = root?.querySelectorAll<HTMLElement>('.nga-accordion-trigger:not(:disabled)') ?? [];
    return Array.from(all).filter(trigger => trigger.closest('.nga-accordion') === root);
  }

}
