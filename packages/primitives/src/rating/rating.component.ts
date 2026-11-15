/**
 * @file Star rating input.
 */

import {
  Component,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

export type NgAtomsRatingSize = 'sm' | 'md' | 'lg';

/** Star rating input. */
@Component({
  selector: 'nga-rating',
  standalone: true,
  templateUrl: './rating.component.html',
  host: {
    class: 'nga-rating',
    '[attr.role]': 'readonly() ? "img" : "radiogroup"',
    '[attr.aria-label]': 'readonly() ? label() + ": " + value() + " of " + max() : label()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.nga-rating--readonly]': 'readonly()',
    '[class.nga-rating--disabled]': 'disabled()',
    '(mouseleave)': 'hover.set(0)',
  },
})
export class NgAtomsRatingComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly value = model<number>(0);
  readonly max = input<number>(5);
  readonly size = input<NgAtomsRatingSize>('md');
  readonly readonly = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  /** Clicking the current value again resets the rating to 0. */
  readonly clearable = input<boolean>(true);
  /** Accessible name of the group. */
  readonly label = input<string>('Rating');

  readonly hover = signal(0);
  readonly stars = computed(() => Array.from({ length: Math.max(0, this.max()) }, (_, i) => i + 1));
  /** Star count currently painted: the hover preview wins over the value. */
  readonly shown = computed(() => this.hover() || this.value());

  private _prevSize: NgAtomsRatingSize = 'md';

  constructor() {
    effect(() => {
      const s = this.size();
      this.renderer.removeClass(this.el.nativeElement, `nga-rating--${this._prevSize}`);
      this.renderer.addClass(this.el.nativeElement, `nga-rating--${s}`);
      this._prevSize = s;
    });
  }

  /** Roving tabindex: the selected star is the tab stop, or the first when empty. */
  tabIndexFor(star: number): number {
    if (this.readonly() || this.disabled()) return -1;
    return star === (this.value() || 1) ? 0 : -1;
  }

  /** Sets the rating. Picking the current value clears it when `clearable` is set. */
  select(star: number): void {
    if (this.readonly() || this.disabled()) return;
    this.value.set(this.clearable() && star === this.value() ? 0 : star);
  }

  /** Previews a rating while the pointer is over a star. */
  onEnter(star: number): void {
    if (this.readonly() || this.disabled()) return;
    this.hover.set(star);
  }

  /** Arrow keys raise and lower the rating; Home and End jump to one star and to the maximum. */
  onKeydown(event: KeyboardEvent): void {
    if (this.readonly() || this.disabled()) return;

    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(this.max(), this.value() + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(this.clearable() ? 0 : 1, this.value() - 1);
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }

    event.preventDefault();
    this.value.set(next);
    const buttons = this.el.nativeElement.querySelectorAll('.nga-rating__star');
    (buttons[Math.max(0, next - 1)] as HTMLElement | undefined)?.focus();
  }
}
