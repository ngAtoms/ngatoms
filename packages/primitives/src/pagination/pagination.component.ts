import {
  Component,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';

export type NgAtomsPaginationSize = 'sm' | 'md' | 'lg';
export type NgAtomsPaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

@Component({
  selector: 'nga-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  host: {
    class: 'nga-pagination',
    role: 'navigation',
    '[attr.aria-label]': 'label()',
  },
})
export class NgAtomsPaginationComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  /** Current page, 1-based. */
  readonly page = model<number>(1);
  /** Total number of items. */
  readonly total = input<number>(0);
  readonly pageSize = input<number>(10);
  /** Pages shown on each side of the current page. */
  readonly siblingCount = input<number>(1);
  readonly size = input<NgAtomsPaginationSize>('md');
  readonly disabled = input<boolean>(false);

  readonly label = input<string>('Pagination');
  readonly previousLabel = input<string>('Previous page');
  readonly nextLabel = input<string>('Next page');

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );

  /** Current page clamped into the valid range. */
  readonly current = computed(() => Math.min(this.pageCount(), Math.max(1, this.page())));

  readonly items = computed<NgAtomsPaginationItem[]>(() => {
    const count = this.pageCount();
    const current = this.current();
    const siblings = Math.max(0, this.siblingCount());

    // first + last + current + 2 * siblings + 2 ellipsis slots
    const slots = siblings * 2 + 5;
    if (count <= slots) return this.range(1, count);

    const left = Math.max(current - siblings, 1);
    const right = Math.min(current + siblings, count);
    const showStart = left > 2;
    const showEnd = right < count - 1;

    if (!showStart && showEnd) {
      return [...this.range(1, siblings * 2 + 3), 'ellipsis-end', count];
    }
    if (showStart && !showEnd) {
      return [1, 'ellipsis-start', ...this.range(count - (siblings * 2 + 2), count)];
    }
    return [1, 'ellipsis-start', ...this.range(left, right), 'ellipsis-end', count];
  });

  private _prevSize: NgAtomsPaginationSize = 'md';

  constructor() {
    effect(() => {
      const s = this.size();
      this.renderer.removeClass(this.el.nativeElement, `nga-pagination--${this._prevSize}`);
      this.renderer.addClass(this.el.nativeElement, `nga-pagination--${s}`);
      this._prevSize = s;
    });
  }

  goTo(page: number): void {
    if (this.disabled()) return;
    this.page.set(Math.min(this.pageCount(), Math.max(1, page)));
  }

  previous(): void {
    this.goTo(this.current() - 1);
  }

  next(): void {
    this.goTo(this.current() + 1);
  }

  private range(from: number, to: number): number[] {
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
}
