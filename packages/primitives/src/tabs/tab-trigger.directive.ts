/**
 * @file The button that activates a tab.
 */

import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { NgAtomsTabsComponent, NgAtomsTabTriggerDirectiveRef } from './tabs.component';

/** The button that activates a tab. */
@Directive({
  selector: '[ngAtomsTabTrigger]',
  standalone: true,
  host: {
    class: 'nga-tab-trigger',
    role: 'tab',
    type: 'button',
  },
})
export class NgAtomsTabTriggerDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly tabs = inject(NgAtomsTabsComponent);

  readonly value = input.required<string>();

  private readonly _ref: NgAtomsTabTriggerDirectiveRef = {
    value: () => this.value(),
    focus: () => this.el.nativeElement.focus(),
  };

  constructor() {
    effect(() => {
      const isActive = this.tabs.activeTab() === this.value();
      if (isActive) {
        this.renderer.addClass(this.el.nativeElement, 'nga-tab-trigger--active');
        this.renderer.setAttribute(this.el.nativeElement, 'aria-selected', 'true');
        this.renderer.setAttribute(this.el.nativeElement, 'tabindex', '0');
      } else {
        this.renderer.removeClass(this.el.nativeElement, 'nga-tab-trigger--active');
        this.renderer.setAttribute(this.el.nativeElement, 'aria-selected', 'false');
        this.renderer.setAttribute(this.el.nativeElement, 'tabindex', '-1');
      }
    });
  }

  /** Registers the trigger with its tabs. */
  ngOnInit(): void {
    this.tabs.register(this._ref);
  }

  /** Activates the tab. */
  @HostListener('click')
  onClick(): void {
    this.tabs.setActive(this.value());
  }

  /**
   * Arrow Left and Arrow Right move to the previous and next tab, wrapping
   * at the ends.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.tabs.navigateNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.tabs.navigatePrev();
    }
  }

  /** Unregisters the trigger. */
  ngOnDestroy(): void {
    this.tabs.unregister(this._ref);
  }
}
