import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgAtomsOverlayService } from '../overlay/overlay.service';
import { computeOverlayPosition } from '../overlay/position';

export type NgAtomsComboboxSize = 'sm' | 'md' | 'lg';

export interface NgAtomsComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type NgAtomsComboboxFilter = (option: NgAtomsComboboxOption, query: string) => boolean;

const defaultFilter: NgAtomsComboboxFilter = (option, query) =>
  option.label.toLowerCase().includes(query.trim().toLowerCase());

let nextId = 0;

@Component({
  selector: 'nga-combobox',
  standalone: true,
  templateUrl: './combobox.component.html',
  styleUrl: './combobox.component.css',
  host: {
    class: 'nga-combobox',
    '[class.nga-combobox--open]': 'open()',
    '[class.nga-combobox--disabled]': 'disabled()',
    '[class.nga-combobox--invalid]': 'invalid()',
  },
})
export class NgAtomsComboboxComponent implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);

  readonly options = input<NgAtomsComboboxOption[]>([]);
  /** Value of the selected option, or null when nothing is selected. */
  readonly value = model<string | null>(null);
  readonly open = model<boolean>(false);
  readonly placeholder = input<string>('');
  readonly size = input<NgAtomsComboboxSize>('md');
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  /** Shown when no option matches the typed text. */
  readonly emptyText = input<string>('No results');
  /** Accessible name. Omit it when a `<label>` already names the field. */
  readonly label = input<string>('');
  /** Custom matcher. Defaults to a case-insensitive "label contains query". */
  readonly filter = input<NgAtomsComboboxFilter>(defaultFilter);

  readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  readonly listId = `nga-combobox-${nextId++}`;

  /** Text currently in the field. */
  readonly query = signal('');
  /** True once the user typed since the panel opened — only then do we filter. */
  private readonly dirty = signal(false);
  readonly activeIndex = signal(-1);

  readonly selected = computed(
    () => this.options().find(o => o.value === this.value()) ?? null,
  );

  readonly filtered = computed(() => {
    if (!this.dirty()) return this.options();
    const query = this.query();
    const filter = this.filter();
    return this.options().filter(o => filter(o, query));
  });

  readonly activeId = computed(() => {
    const i = this.activeIndex();
    return this.open() && i >= 0 && i < this.filtered().length ? this.optionId(i) : null;
  });

  private deregister: (() => void) | null = null;
  private _prevSize: NgAtomsComboboxSize = 'md';

  constructor() {
    effect(() => {
      const s = this.size();
      this.renderer.removeClass(this.el.nativeElement, `nga-combobox--${this._prevSize}`);
      this.renderer.addClass(this.el.nativeElement, `nga-combobox--${s}`);
      this._prevSize = s;
    });

    // Keep the field text in sync with the selection whenever it changes
    // from outside or the panel closes without a pick.
    effect(() => {
      const label = this.selected()?.label ?? '';
      if (!this.open()) {
        untracked(() => {
          this.query.set(label);
          this.dirty.set(false);
        });
      }
    });

    effect(() => {
      if (this.open()) {
        this.deregister = this.overlay.register(
          () => this.open.set(false),
          [this.el.nativeElement, this.panelEl().nativeElement],
          { closeOnScroll: false },
        );
        untracked(() => {
          const selectedIndex = this.filtered().findIndex(o => o.value === this.value());
          this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : this.firstEnabled());
        });
        requestAnimationFrame(() => {
          this.position();
          this.scrollActiveIntoView();
        });
      } else {
        this.deregister?.();
        this.deregister = null;
      }
    });

    afterNextRender(() => {
      this.renderer.appendChild(this.document.body, this.panelEl().nativeElement);
    });
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.open()) this.position();
  }

  optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  openPanel(): void {
    if (!this.disabled()) this.open.set(true);
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open.update(v => !v);
    this.inputEl().nativeElement.focus();
  }

  select(option: NgAtomsComboboxOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.open.set(false);
  }

  onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.dirty.set(true);
    // Emptying the field clears the selection.
    if (!text) this.value.set(null);
    this.open.set(true);
    this.activeIndex.set(this.firstEnabled());
    requestAnimationFrame(() => this.position());
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open()) this.openPanel();
        else this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open()) this.openPanel();
        else this.move(-1);
        break;
      case 'Enter': {
        const option = this.filtered()[this.activeIndex()];
        if (this.open() && option) {
          event.preventDefault();
          this.select(option);
        }
        break;
      }
      case 'Tab':
        this.open.set(false);
        break;
    }
  }

  private firstEnabled(): number {
    return this.filtered().findIndex(o => !o.disabled);
  }

  /** Moves the active option by one, skipping disabled options and wrapping. */
  private move(delta: 1 | -1): void {
    const options = this.filtered();
    if (!options.length) return;

    let i = this.activeIndex();
    for (let step = 0; step < options.length; step++) {
      i = (i + delta + options.length) % options.length;
      if (!options[i].disabled) {
        this.activeIndex.set(i);
        requestAnimationFrame(() => this.scrollActiveIntoView());
        return;
      }
    }
  }

  private scrollActiveIntoView(): void {
    const id = this.activeId();
    if (id) this.document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
  }

  private position(): void {
    const panel = this.panelEl().nativeElement;
    const anchor = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(panel, 'width', `${anchor.width}px`);

    const pos = computeOverlayPosition(anchor, panel.getBoundingClientRect(), {
      placement: 'bottom',
      align: 'start',
      gap: 4,
      margin: 8,
    });
    this.renderer.setStyle(panel, 'top', `${pos.top}px`);
    this.renderer.setStyle(panel, 'left', `${pos.left}px`);
  }

  ngOnDestroy(): void {
    this.deregister?.();
    const panel = this.panelEl().nativeElement;
    if (panel.parentElement === this.document.body) {
      this.renderer.removeChild(this.document.body, panel);
    }
  }
}
