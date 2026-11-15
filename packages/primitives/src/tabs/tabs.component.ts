/**
 * @file Tabs root, and the reference its triggers register with.
 */

import {
  Component,
  effect,
  input,
  signal,
} from '@angular/core';

export type NgAtomsTabsVariant = 'underline' | 'pills';

/** What the tabs know about a trigger: its value, and how to focus it. */
export class NgAtomsTabTriggerDirectiveRef {
  value!: () => string;
  focus!: () => void;
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

  /** Adds a trigger. The first one becomes active when no tab is. */
  register(trigger: NgAtomsTabTriggerDirectiveRef): void {
    this._triggers.push(trigger);
    if (!this.activeTab() && this._triggers.length === 1) {
      this.activeTab.set(trigger.value());
    }
  }

  /** Removes a trigger. */
  unregister(trigger: NgAtomsTabTriggerDirectiveRef): void {
    const idx = this._triggers.indexOf(trigger);
    if (idx >= 0) this._triggers.splice(idx, 1);
  }

  /** Activates and focuses the tab after the active one, wrapping to the first. */
  navigateNext(): void {
    const idx = this._triggers.findIndex(t => t.value() === this.activeTab());
    const next = this._triggers[(idx + 1) % this._triggers.length];
    if (next) { this.setActive(next.value()); next.focus(); }
  }

  /** Activates and focuses the tab before the active one, wrapping to the last. */
  navigatePrev(): void {
    const idx = this._triggers.findIndex(t => t.value() === this.activeTab());
    const prev = this._triggers[(idx - 1 + this._triggers.length) % this._triggers.length];
    if (prev) { this.setActive(prev.value()); prev.focus(); }
  }

}
