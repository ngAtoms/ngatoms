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
import { TAB_TRIGGER_ELEMENTS, TAB_TRIGGER_REFS, triggerChanges } from './tab-trigger-links';
import { NgAtomsTabsComponent, NgAtomsTabTriggerDirectiveRef } from './tabs.component';

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

  /** Notices the trigger being disabled or enabled at runtime, by a binding or by hand. */
  private readonly disabledWatch =
    typeof MutationObserver === 'undefined' ? null : new MutationObserver(() => this.bumpTriggerChanges());

  /**
   * Keeps the trigger's selected state and its place in the tab order. The
   * selection follows the active tab; the tab stop is the active tab while it
   * is enabled, otherwise the first enabled trigger, so the list stays
   * reachable from the keyboard when the active tab is disabled at runtime.
   */
  constructor() {
    effect(() => {
      const active = this.tabs.activeTab();
      triggerChanges(this.tabs)();
      const isActive = active === this.value();
      if (isActive) {
        this.renderer.addClass(this.el.nativeElement, 'nga-tab-trigger--active');
        this.renderer.setAttribute(this.el.nativeElement, 'aria-selected', 'true');
      } else {
        this.renderer.removeClass(this.el.nativeElement, 'nga-tab-trigger--active');
        this.renderer.setAttribute(this.el.nativeElement, 'aria-selected', 'false');
      }
      this.renderer.setAttribute(this.el.nativeElement, 'tabindex', this.isTabStop(active) ? '0' : '-1');
    });
  }

  /** Registers the trigger with its tabs, linked to its element so the tabs can tell when it is disabled. */
  ngOnInit(): void {
    TAB_TRIGGER_ELEMENTS.set(this._ref, this.el.nativeElement);
    TAB_TRIGGER_REFS.set(this.el.nativeElement, this._ref);
    this.tabs.register(this._ref);
    this.disabledWatch?.observe(this.el.nativeElement, { attributes: true, attributeFilter: ['disabled'] });
    this.bumpTriggerChanges();
  }

  /** Activates the tab. */
  @HostListener('click')
  onClick(): void {
    this.tabs.setActive(this.value());
  }

  /**
   * Arrow Left and Arrow Right move to the previous and next tab, wrapping
   * at the ends; Home and End to the first and last (Fn+← and Fn+→ on a
   * Mac). With Ctrl, Alt, Meta or Shift held, those keys are left to the
   * page, so Alt+← still goes back in the browser.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.tabs.navigateNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.tabs.navigatePrev();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const enabled = this.enabledSiblings();
      this.activate(event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1]);
    }
  }

  /** Unregisters the trigger. */
  ngOnDestroy(): void {
    this.disabledWatch?.disconnect();
    TAB_TRIGGER_ELEMENTS.delete(this._ref);
    TAB_TRIGGER_REFS.delete(this.el.nativeElement);
    this.tabs.unregister(this._ref);
    this.bumpTriggerChanges();
  }

  /** Tells every trigger of the same tabs to work out the tab stop again. */
  private bumpTriggerChanges(): void {
    triggerChanges(this.tabs).update(count => count + 1);
  }

  /**
   * Whether this trigger holds the tab stop: the active tab while it is
   * enabled, otherwise the first enabled trigger.
   */
  private isTabStop(active: string): boolean {
    const own = this.el.nativeElement as HTMLElement;
    const activeElement = this.siblings().find(element => TAB_TRIGGER_REFS.get(element)?.value() === active);
    if (activeElement && !activeElement.matches(':disabled')) return activeElement === own;
    return this.enabledSiblings()[0] === own;
  }

  /** The triggers of the same tabs, in order, without those of nested tabs. */
  private siblings(): HTMLElement[] {
    const root = (this.el.nativeElement as HTMLElement).closest('.nga-tabs');
    const all = root?.querySelectorAll<HTMLElement>('.nga-tab-trigger') ?? [];
    return Array.from(all).filter(trigger => trigger.closest('.nga-tabs') === root);
  }

  /** The enabled triggers of the same tabs, in order, without those of nested tabs. */
  private enabledSiblings(): HTMLElement[] {
    return this.siblings().filter(trigger => !trigger.matches(':disabled'));
  }

  /** Makes the tab of a trigger element active and gives it focus. */
  private activate(element: HTMLElement | undefined): void {
    const ref = element && TAB_TRIGGER_REFS.get(element);
    if (!ref) return;
    this.tabs.setActive(ref.value());
    ref.focus();
  }
}
