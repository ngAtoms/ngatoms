/**
 * @file Tabs root, and the reference its triggers register with.
 */

import {
  Component,
  effect,
  input,
  signal,
} from '@angular/core';
import { TAB_TRIGGER_ELEMENTS } from './tab-trigger-links';

export type NgAtomsTabsVariant = 'underline' | 'pills';

/** What the tabs know about a trigger: its value, and how to focus it. */
export class NgAtomsTabTriggerDirectiveRef {
  value!: () => string;
  focus!: () => void;
}

/** Sorts triggers by where their elements sit in the document; unlinked ones keep their place. */
function byPageOrder(a: NgAtomsTabTriggerDirectiveRef, b: NgAtomsTabTriggerDirectiveRef): number {
  const first = TAB_TRIGGER_ELEMENTS.get(a);
  const second = TAB_TRIGGER_ELEMENTS.get(b);
  if (!first || !second || first === second) return 0;
  return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/** Tabs root. Holds the active tab and the triggers, in order. */
@Component({
  selector: 'nga-tabs',
  standalone: true,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css',
  host: {
    class: 'nga-tabs',
    '[class.nga-tabs--underline]': "variant() === 'underline'",
    '[class.nga-tabs--pills]': "variant() === 'pills'",
  },
})
export class NgAtomsTabsComponent {
  readonly defaultValue = input<string>('');
  readonly variant = input<NgAtomsTabsVariant>('underline');

  readonly activeTab = signal<string>('');

  private readonly _triggers: NgAtomsTabTriggerDirectiveRef[] = [];

  constructor() {
    effect(() => {
      const def = this.defaultValue();
      if (def && !this.activeTab()) {
        this.activeTab.set(def);
      }
    });
  }

  /** Makes a tab active. */
  setActive(value: string): void {
    this.activeTab.set(value);
  }

  /** Adds a trigger. The first enabled one becomes active when no tab is. */
  register(trigger: NgAtomsTabTriggerDirectiveRef): void {
    this._triggers.push(trigger);
    if (!this.activeTab() && !this.isDisabled(trigger)) {
      this.activeTab.set(trigger.value());
    }
  }

  /** Removes a trigger. */
  unregister(trigger: NgAtomsTabTriggerDirectiveRef): void {
    const idx = this._triggers.indexOf(trigger);
    if (idx >= 0) this._triggers.splice(idx, 1);
  }

  /** Activates and focuses the next enabled tab after the active one, wrapping to the first. */
  navigateNext(): void {
    this.step(1);
  }

  /** Activates and focuses the previous enabled tab before the active one, wrapping to the last. */
  navigatePrev(): void {
    this.step(-1);
  }

  /** Whether a trigger's element is disabled; keyboard navigation and activation skip it. */
  private isDisabled(trigger: NgAtomsTabTriggerDirectiveRef): boolean {
    return TAB_TRIGGER_ELEMENTS.get(trigger)?.matches(':disabled') ?? false;
  }

  /**
   * The triggers keyboard navigation can land on, in the order they appear
   * on the page. Registration order is not enough: a tab added later by an
   * `@if`, or moved by an `@for`, registers out of place. The triggers'
   * Home/End and tab stop read the same DOM order.
   */
  private enabledTriggers(): NgAtomsTabTriggerDirectiveRef[] {
    return this._triggers.filter(trigger => !this.isDisabled(trigger)).sort(byPageOrder);
  }

  /**
   * Moves one enabled tab forward or back from the active one, wrapping.
   * When the active tab is not among the enabled ones (disabled at runtime),
   * it moves from the tab stop, the first enabled tab, which is where focus is.
   */
  private step(direction: 1 | -1): void {
    const enabled = this.enabledTriggers();
    if (!enabled.length) return;
    const idx = enabled.findIndex(t => t.value() === this.activeTab());
    const from = idx < 0 ? 0 : idx;
    this.activate(enabled[(from + direction + enabled.length) % enabled.length]);
  }

  /** Makes a trigger's tab active and gives it focus; a disabled trigger is left alone. */
  private activate(trigger: NgAtomsTabTriggerDirectiveRef | undefined): void {
    if (!trigger || this.isDisabled(trigger)) return;
    this.setActive(trigger.value());
    trigger.focus();
  }
}
