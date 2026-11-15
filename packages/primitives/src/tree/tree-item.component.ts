/**
 * @file One item of a tree, which may hold child items.
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  contentChildren,
  inject,
  input,
  model,
} from '@angular/core';
import { NGA_TREE, NgAtomsTreeItemRef } from './tree.component';

/** One item of a tree, which may hold child items. */
@Component({
  selector: 'nga-tree-item',
  standalone: true,
  templateUrl: './tree-item.component.html',
  host: {
    class: 'nga-tree-item',
    role: 'treeitem',
    '[attr.aria-level]': 'level',
    '[attr.aria-expanded]': 'hasChildren() ? expanded() : null',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': 'tree.active() === element ? 0 : -1',
    '[style.--nga-tree-level]': 'level',
    '[class.nga-tree-item--selected]': 'isSelected()',
    '[class.nga-tree-item--expanded]': 'expanded()',
    '[class.nga-tree-item--disabled]': 'disabled()',
  },
})
export class NgAtomsTreeItemComponent implements NgAtomsTreeItemRef, OnDestroy {
  readonly tree = inject(NGA_TREE);
  readonly element: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly parent = inject(NgAtomsTreeItemComponent, { optional: true, skipSelf: true });

  /** Identifies the item for selection. Must be unique within the tree. */
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly expanded = model<boolean>(false);
  readonly disabled = input<boolean>(false);

  /** Depth in the tree, 1-based. */
  readonly level: number = (this.parent?.level ?? 0) + 1;

  private readonly children = contentChildren(NgAtomsTreeItemComponent);
  readonly hasChildren = computed(() => this.children().length > 0);
  readonly isExpanded = computed(() => this.expanded());
  readonly isSelected = computed(() => this.tree.selected() === this.value());

  constructor() {
    this.tree.register(this);
  }

  /** Opens or closes the branch. */
  setExpanded(expanded: boolean): void {
    this.expanded.set(expanded);
  }

  /** Makes this the selected item, unless it is disabled. */
  select(): void {
    if (this.disabled()) return;
    this.tree.select(this.value());
  }

  /** Row click: select the item and toggle its branch. */
  onRowClick(): void {
    if (this.disabled()) return;
    this.select();
    if (this.hasChildren()) this.expanded.update(v => !v);
    this.element.focus();
  }

  /** Unregisters the item from its tree. */
  ngOnDestroy(): void {
    this.tree.unregister(this);
  }
}
