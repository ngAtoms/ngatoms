/**
 * @file Filter popover: the editor shown from a column header for the
 * built-in text, number and set filters. It edits a draft and reports the
 * resulting filter; applying it to the rows is the grid's job.
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  GridCellValue,
  GridColumn,
  GridFilter,
  GridNumberOperator,
  GridTextOperator,
  isEmptyValue,
} from '../grid-core';
import { NgAtomsOverlayService } from '../overlay/overlay.service';
import { computeOverlayPosition } from '../overlay/position';
import { GridFilterOption } from './grid.context';

/** An operator choice of the text or number editor. */
interface OperatorOption<O> {
  value: O;
  label: string;
}

const TEXT_OPERATORS: OperatorOption<GridTextOperator>[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'equals', label: 'Equals' },
  { value: 'empty', label: 'Is empty' },
];

const NUMBER_OPERATORS: OperatorOption<GridNumberOperator>[] = [
  { value: 'eq', label: 'Equal to' },
  { value: 'ne', label: 'Not equal to' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal to' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal to' },
  { value: 'between', label: 'Between' },
  { value: 'empty', label: 'Is empty' },
];

/** Gap between the header button and the popover, in px. */
const POPOVER_GAP = 6;

/** Normalizes a value for set membership: every kind of empty becomes null. */
function setKey(value: GridCellValue): GridCellValue {
  return isEmptyValue(value) ? null : value;
}

/** Reads a number input; an empty or invalid field yields undefined. */
function readNumber(event: Event): number | undefined {
  const parsed = (event.target as HTMLInputElement).valueAsNumber;
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Popover that edits the filter of one column. */
@Component({
  selector: 'nga-grid-filter',
  standalone: true,
  templateUrl: './grid-filter.component.html',
  host: { class: 'nga-grid-filter-host' },
})
export class NgAtomsGridFilterComponent<T = unknown> implements OnInit, OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  readonly column = input.required<GridColumn<T>>();
  /** Header button the popover is anchored to; focus returns to it on close. */
  readonly anchor = input.required<HTMLElement>();
  /** The column's current filter, used to seed the draft. */
  readonly filter = input<GridFilter<T> | undefined>(undefined);
  /** Distinct values of the column, for the set editor. */
  readonly options = input<GridFilterOption[]>([]);

  /** The user applied the draft. Null means "no filter on this column". */
  readonly apply = output<GridFilter<T> | null>();
  /** The popover asked to close without applying. */
  readonly dismiss = output<void>();

  protected readonly textOperators = TEXT_OPERATORS;
  protected readonly numberOperators = NUMBER_OPERATORS;

  protected readonly textOperator = signal<GridTextOperator>('contains');
  protected readonly text = signal('');
  protected readonly numberOperator = signal<GridNumberOperator>('eq');
  protected readonly from = signal<number | undefined>(undefined);
  protected readonly to = signal<number | undefined>(undefined);
  protected readonly search = signal('');
  /** Values ticked in the set editor. */
  protected readonly selected = signal<ReadonlySet<GridCellValue>>(new Set());

  /** Set-editor entries narrowed by the search box. */
  protected readonly visibleOptions = computed(() => {
    const needle = this.search().trim().toLocaleLowerCase();
    if (!needle) return this.options();
    return this.options().filter(option => option.label.toLocaleLowerCase().includes(needle));
  });

  protected readonly allSelected = computed(() => this.selected().size === this.options().length);

  private deregister: (() => void) | null = null;

  constructor() {
    afterNextRender(() => this.show());
  }

  /** Seeds the draft from the column's current filter. */
  ngOnInit(): void {
    const filter = this.filter();
    this.selected.set(new Set(this.options().map(option => setKey(option.value))));
    if (filter?.type === 'text') {
      this.textOperator.set(filter.operator);
      this.text.set(filter.value ?? '');
    } else if (filter?.type === 'number') {
      this.numberOperator.set(filter.operator);
      this.from.set(filter.value);
      this.to.set(filter.to);
    } else if (filter?.type === 'set') {
      this.selected.set(new Set(filter.values.map(setKey)));
    }
  }

  /** Removes the popover from the page and gives focus back to the header button. */
  ngOnDestroy(): void {
    this.deregister?.();
    const panel = this.panel().nativeElement;
    const hadFocus = panel.contains(this.document.activeElement);
    if (panel.parentElement === this.document.body) this.renderer.removeChild(this.document.body, panel);
    if (hadFocus) this.anchor().focus();
  }

  /** Updates the text operator from its select. */
  protected onTextOperator(event: Event): void {
    this.textOperator.set((event.target as HTMLSelectElement).value as GridTextOperator);
  }

  /** Updates the number operator from its select. */
  protected onNumberOperator(event: Event): void {
    this.numberOperator.set((event.target as HTMLSelectElement).value as GridNumberOperator);
  }

  /** Updates the text draft. */
  protected onText(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  /** Updates the lower (or only) number bound. */
  protected onFrom(event: Event): void {
    this.from.set(readNumber(event));
  }

  /** Updates the upper bound of a `between` filter. */
  protected onTo(event: Event): void {
    this.to.set(readNumber(event));
  }

  /** Updates the set editor's search text. */
  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Whether a set entry is ticked. */
  protected isSelected(option: GridFilterOption): boolean {
    return this.selected().has(setKey(option.value));
  }

  /** Ticks or unticks one set entry. */
  protected toggleOption(option: GridFilterOption): void {
    const next = new Set(this.selected());
    const key = setKey(option.value);
    if (!next.delete(key)) next.add(key);
    this.selected.set(next);
  }

  /** Ticks every entry, or clears them all when everything is already ticked. */
  protected toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.options().map(option => setKey(option.value))));
  }

  /** Applies the draft. */
  protected submit(): void {
    this.apply.emit(this.buildFilter());
  }

  /** Removes the column's filter. */
  protected clear(): void {
    this.apply.emit(null);
  }

  /**
   * Turns the draft into a filter.
   * A draft that would not filter anything (no text, no bound, every set
   * entry ticked) yields null, so the column shows as unfiltered.
   */
  private buildFilter(): GridFilter<T> | null {
    switch (this.column().filter) {
      case 'text': {
        const operator = this.textOperator();
        const value = this.text().trim();
        return operator === 'empty' || value ? { type: 'text', operator, value } : null;
      }
      case 'number': {
        const operator = this.numberOperator();
        const value = this.from();
        const to = operator === 'between' ? this.to() : undefined;
        const hasBound = value !== undefined || to !== undefined;
        return operator === 'empty' || hasBound ? { type: 'number', operator, value, to } : null;
      }
      case 'set':
        return this.allSelected() ? null : { type: 'set', values: [...this.selected()] };
      default:
        return null;
    }
  }

  /**
   * Moves the popover to the document body, places it under the header
   * button and focuses its first field.
   * It lives in the body because an ancestor with a transform or filter
   * would otherwise clip a fixed-position element.
   */
  private show(): void {
    const panel = this.panel().nativeElement;
    const anchor = this.anchor();
    this.renderer.appendChild(this.document.body, panel);

    const position = computeOverlayPosition(anchor.getBoundingClientRect(), panel.getBoundingClientRect(), {
      placement: 'bottom',
      align: 'start',
      gap: POPOVER_GAP,
    });
    this.renderer.setStyle(panel, 'top', `${position.top}px`);
    this.renderer.setStyle(panel, 'left', `${position.left}px`);

    this.deregister = this.overlay.register(() => this.dismiss.emit(), [panel, anchor], {
      closeOnScroll: false,
    });
    panel.querySelector<HTMLElement>('select, input')?.focus();
  }
}
