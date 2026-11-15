/**
 * @file Tree root. Holds the selected item, the item that has the tab stop,
 * and keyboard navigation.
 */

import {
  Component,
  ElementRef,
  HostListener,
  InjectionToken,
  Signal,
  afterNextRender,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/** What the tree needs from each item to drive keyboard navigation. */
export interface NgAtomsTreeItemRef {
  readonly element: HTMLElement;
  readonly hasChildren: Signal<boolean>;
  readonly isExpanded: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  setExpanded(expanded: boolean): void;
  select(): void;
}

export interface NgAtomsTreeContext {
  readonly selected: Signal<string | null>;
  /** Element holding the roving tab stop. */
  readonly active: Signal<HTMLElement | null>;
  select(value: string): void;
  register(item: NgAtomsTreeItemRef): void;
  unregister(item: NgAtomsTreeItemRef): void;
}

export const NGA_TREE = new InjectionToken<NgAtomsTreeContext>('NGA_TREE');

/** Tree root. Holds the selected item, the item that has the tab stop, and keyboard navigation. */
@Component({
  selector: 'nga-tree',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: 'nga-tree',
    role: 'tree',
    '[attr.aria-label]': 'label() || null',
  },
  providers: [{ provide: NGA_TREE, useExisting: NgAtomsTreeComponent }],
})
export class NgAtomsTreeComponent implements NgAtomsTreeContext {
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Value of the selected item, or null. */
  readonly selected = model<string | null>(null);
  /** Accessible name of the tree. */
  readonly label = input<string>('');

  readonly active = signal<HTMLElement | null>(null);

  private readonly items = new Map<HTMLElement, NgAtomsTreeItemRef>();

  /**
   * Gives the first visible item the tab stop once rendered: without one the
   * tree could not be reached from the keyboard.
   */
  constructor() {
    afterNextRender(() => {
      if (!this.active()) this.active.set(this.visible()[0]?.element ?? null);
    });
  }

  /** Makes an item the selected one. */
  select(value: string): void {
    this.selected.set(value);
  }

  /** Adds an item. */
  register(item: NgAtomsTreeItemRef): void {
    this.items.set(item.element, item);
  }

  /** Removes an item. If it had the tab stop, the first visible item takes it. */
  unregister(item: NgAtomsTreeItemRef): void {
    this.items.delete(item.element);
    if (this.active() === item.element) this.active.set(this.visible()[0]?.element ?? null);
  }

  /** Gives the tab stop to the item that received focus. */
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    const item = this.itemFor(event.target);
    if (item) this.active.set(item.element);
  }

  /**
   * Arrow Down and Arrow Up move through the visible items; Arrow Right opens a
   * branch or enters it, Arrow Left closes it or goes to the parent; Home and
   * End jump to the ends; Enter or Space selects. Keys pressed in a control
   * inside an item are left alone.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const item = this.itemFor(event.target);
    if (!item || event.target !== item.element) return;

    const visible = this.visible();
    const index = visible.indexOf(item);

    switch (event.key) {
      case 'ArrowDown':
        this.focus(visible[index + 1]);
        break;
      case 'ArrowUp':
        this.focus(visible[index - 1]);
        break;
      case 'ArrowRight':
        if (!item.hasChildren()) return;
        if (!item.isExpanded()) item.setExpanded(true);
        else this.focus(visible[index + 1]);
        break;
      case 'ArrowLeft':
        if (item.hasChildren() && item.isExpanded()) item.setExpanded(false);
        else this.focus(this.parentOf(item));
        break;
      case 'Home':
        this.focus(visible[0]);
        break;
      case 'End':
        this.focus(visible[visible.length - 1]);
        break;
      case 'Enter':
      case ' ':
        item.select();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Focuses an item. */
  private focus(item: NgAtomsTreeItemRef | undefined): void {
    item?.element.focus();
  }

  /** The item an event target belongs to. */
  private itemFor(target: EventTarget | null): NgAtomsTreeItemRef | undefined {
    const element = (target as HTMLElement | null)?.closest?.('.nga-tree-item') as HTMLElement | null;
    return element ? this.items.get(element) : undefined;
  }

  /** The item a nested item sits in. */
  private parentOf(item: NgAtomsTreeItemRef): NgAtomsTreeItemRef | undefined {
    const parent = item.element.parentElement?.closest('.nga-tree-item') as HTMLElement | null;
    return parent ? this.items.get(parent) : undefined;
  }

  /** Enabled items in DOM order, skipping those inside a collapsed branch. */
  private visible(): NgAtomsTreeItemRef[] {
    const elements: HTMLElement[] = Array.from(this.el.nativeElement.querySelectorAll('.nga-tree-item'));
    return elements
      .filter(element => !element.closest('[hidden]'))
      .map(element => this.items.get(element))
      .filter((item): item is NgAtomsTreeItemRef => !!item && !item.disabled());
  }
}
