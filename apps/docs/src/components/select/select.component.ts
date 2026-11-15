import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgClass } from '@angular/common';
import { NgAtomsOverlayService } from '../overlay/overlay.service';

export interface NgAtomsSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type NgAtomsSelectVariant = 'default' | 'filled' | 'ghost';
export type NgAtomsSelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'nga-select',
  standalone: true,
  imports: [NgClass],
  host: { class: 'nga-select-root' },
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
})
export class NgAtomsSelectComponent implements AfterViewChecked, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly overlay = inject(NgAtomsOverlayService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private deregister: (() => void) | null = null;

  readonly triggerEl = viewChild.required<ElementRef<HTMLButtonElement>>('triggerEl');
  readonly searchInputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly panelEl = viewChild<ElementRef<HTMLElement>>('panelEl');

  readonly options = input<NgAtomsSelectOption[]>([]);
  readonly placeholder = input<string>('Select...');
  readonly multiple = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly variant = input<NgAtomsSelectVariant>('default');
  readonly size = input<NgAtomsSelectSize>('md');
  /** Opens the panel as soon as the select is created — for a select that appears on demand, such as an inline editor. */
  readonly defaultOpen = input<boolean>(false);

  readonly value = model<string | string[] | null>(null);

  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly focusedIndex = signal(-1);
  readonly panelAbove = signal(false);

  private _shouldFocusSearch = false;

  /** Repositions the panel when anything but the panel itself scrolls. */
  private readonly onAnyScroll = (event: Event): void => {
    const panel = this.panelEl()?.nativeElement;
    if (panel && !panel.contains(event.target as Node)) this.positionPanel();
  };

  constructor() {
    /*
     * The panel is moved to <body> once it renders, so no scroll
     * container or transformed ancestor can clip it. Angular no longer
     * finds it where it rendered it, so the cleanup takes it out.
     */
    effect(onCleanup => {
      const panel = this.panelEl()?.nativeElement;
      if (!panel) return;
      this.renderer.appendChild(this.document.body, panel);
      this.positionPanel();
      this.deregister?.();
      this.deregister = this.overlay.register(
        () => this.close(false),
        [this.el.nativeElement, panel],
        { closeOnScroll: false }
      );
      onCleanup(() => panel.remove());
    });
    afterNextRender(() => {
      if (this.defaultOpen()) this.toggleOpen();
    });
  }

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.options();
    return this.options().filter(o => o.label.toLowerCase().includes(query));
  });

  readonly focusedOptionId = computed(() =>
    this.focusedIndex() >= 0 ? `nga-select-opt-${this.focusedIndex()}` : null
  );

  readonly hasValue = computed(() => {
    const val = this.value();
    if (this.multiple()) return Array.isArray(val) && val.length > 0;
    return val !== null && val !== undefined && val !== '';
  });

  readonly displayValue = computed(() => {
    const val = this.value();
    const opts = this.options();
    if (this.multiple()) {
      const values = (Array.isArray(val) ? val : []) as string[];
      if (values.length === 0) return this.placeholder();
      if (values.length === 1) return opts.find(o => o.value === values[0])?.label ?? values[0];
      return `${values.length} selected`;
    }
    if (!val) return this.placeholder();
    return opts.find(o => o.value === (val as string))?.label ?? String(val);
  });

  readonly triggerClasses = computed(() => ({
    'nga-select-trigger': true,
    [`nga-select-trigger--${this.variant()}`]: true,
    [`nga-select-trigger--${this.size()}`]: true,
    'nga-select-trigger--open': this.isOpen(),
    'nga-select-trigger--invalid': this.invalid(),
  }));

  isSelected(optValue: string): boolean {
    const val = this.value();
    if (this.multiple()) return (Array.isArray(val) ? val : []).includes(optValue);
    return val === optValue;
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    if (!this.isOpen()) {
      this.isOpen.set(true);
      this.document.addEventListener('scroll', this.onAnyScroll, true);
      if (this.searchable()) this._shouldFocusSearch = true;
    } else {
      this.close();
    }
  }

  close(returnFocus = true): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
    this.detach();
    if (returnFocus) {
      this.triggerEl().nativeElement.focus();
    }
  }

  selectOption(option: NgAtomsSelectOption): void {
    if (option.disabled) return;
    if (this.multiple()) {
      const current = (Array.isArray(this.value()) ? this.value() : []) as string[];
      const idx = current.indexOf(option.value);
      this.value.set(idx >= 0 ? current.filter(v => v !== option.value) : [...current, option.value]);
    } else {
      this.value.set(option.value);
      this.close();
    }
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.focusedIndex.set(-1);
  }

  /**
   * Keyboard handling on the trigger. Escape on a closed select is left
   * alone: it belongs to whatever contains the select, a dialog or an
   * inline editor.
   */
  onTriggerKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape', 'Home', 'End'].includes(event.key)) return;
    if (event.key === 'Escape' && !this.isOpen()) return;
    event.preventDefault();
    if (!this.isOpen()) {
      if (event.key !== 'Escape') this.toggleOpen();
      return;
    }
    const opts = this.filteredOptions();
    switch (event.key) {
      case 'ArrowDown': this.focusedIndex.update(i => Math.min(i + 1, opts.length - 1)); break;
      case 'ArrowUp':   this.focusedIndex.update(i => Math.max(i - 1, 0)); break;
      case 'Home':      this.focusedIndex.set(0); break;
      case 'End':       this.focusedIndex.set(opts.length - 1); break;
      case 'Enter':
      case ' ': {
        const idx = this.focusedIndex();
        if (idx >= 0 && idx < opts.length) this.selectOption(opts[idx]);
        break;
      }
      case 'Escape': this.close(); break;
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const opts = this.filteredOptions();
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); this.focusedIndex.update(i => Math.min(i + 1, opts.length - 1)); break;
      case 'ArrowUp':   event.preventDefault(); this.focusedIndex.update(i => Math.max(i - 1, 0)); break;
      case 'Home':      event.preventDefault(); this.focusedIndex.set(0); break;
      case 'End':       event.preventDefault(); this.focusedIndex.set(opts.length - 1); break;
      case 'Enter':     event.preventDefault(); { const idx = this.focusedIndex(); if (idx >= 0 && idx < opts.length) this.selectOption(opts[idx]); } break;
      case 'Escape':    event.preventDefault(); this.close(); break;
    }
  }

  ngAfterViewChecked(): void {
    if (this._shouldFocusSearch) {
      const input = this.searchInputEl();
      if (input) {
        input.nativeElement.focus();
        this._shouldFocusSearch = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.detach();
  }

  /** Stops listening for outside clicks and scrolling. */
  private detach(): void {
    this.deregister?.();
    this.deregister = null;
    this.document.removeEventListener('scroll', this.onAnyScroll, true);
  }

  /** Places the panel under the trigger, or above it when there is no room below. */
  private positionPanel(): void {
    const panel = this.panelEl()?.nativeElement;
    if (!panel) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const gap = 4;
    const margin = 8;
    const view = this.document.defaultView;
    const viewHeight = view?.innerHeight ?? 0;
    const viewWidth = view?.innerWidth ?? 0;

    this.renderer.setStyle(panel, 'width', `${rect.width}px`);
    const height = panel.offsetHeight;
    const above = rect.bottom + gap + height > viewHeight - margin && rect.top > viewHeight - rect.bottom;
    this.panelAbove.set(above);

    const top = above ? rect.top - height - gap : rect.bottom + gap;
    const left = Math.max(margin, Math.min(rect.left, viewWidth - rect.width - margin));
    this.renderer.setStyle(panel, 'top', `${top}px`);
    this.renderer.setStyle(panel, 'left', `${left}px`);
  }
}
