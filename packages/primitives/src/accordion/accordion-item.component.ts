/**
 * @file One item of an accordion: a trigger and the panel it opens.
 */

import {
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgAtomsAccordionComponent } from './accordion.component';

/** One item of an accordion: a trigger and the panel it opens. */
@Component({
  selector: 'nga-accordion-item',
  standalone: true,
  templateUrl: './accordion-item.component.html',
  styleUrl: './accordion-item.component.css',
  host: {
    class: 'nga-accordion-item',
    '[class.nga-accordion-item--open]': 'isOpen()',
  },
})
export class NgAtomsAccordionItemComponent {
  private readonly accordion = inject(NgAtomsAccordionComponent);

  readonly value = input.required<string>();

  readonly isOpen = computed(() => this.accordion.openItems().has(this.value()));

  /** Opens the item, or closes it when it is open. */
  toggle(): void {
    this.accordion.toggle(this.value());
  }

}
