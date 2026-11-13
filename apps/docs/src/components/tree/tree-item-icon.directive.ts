import { Directive } from '@angular/core';

/** Marks an element (icon, avatar…) to render before the item label. */
@Directive({
  selector: '[ngAtomsTreeItemIcon]',
  standalone: true,
  host: { class: 'nga-tree-item__icon', 'aria-hidden': 'true' },
})
export class NgAtomsTreeItemIconDirective {}
