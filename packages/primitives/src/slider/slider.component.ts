/**
 * @file Slider with one thumb, or two for a range.
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
  viewChild,
} from '@angular/core';

export type NgAtomsSliderSize = 'sm' | 'md' | 'lg';
export type NgAtomsSliderMode = 'single' | 'range';

interface SliderThumb {
  index: number;
  value: number;
  percent: number;
  /** Bounds this thumb can move within (the other thumb limits it in range mode). */
  min: number;
  max: number;
  label: string;
}

/** Slider with one thumb, or two for a range. */
@Component({
  selector: 'nga-slider',
  standalone: true,
  templateUrl: './slider.component.html',
  host: {
    class: 'nga-slider',
    '[class.nga-slider--disabled]': 'disabled()',
    '[class.nga-slider--dragging]': 'dragging !== null',
  },
})
export class NgAtomsSliderComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  readonly mode = input<NgAtomsSliderMode>('single');
  /** Single mode value. */
  readonly value = model<number>(0);
  /** Range mode value as `[start, end]`. */
  readonly range = model<[number, number]>([0, 100]);
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly size = input<NgAtomsSliderSize>('md');
  readonly disabled = input<boolean>(false);
  /** Accessible name for the single thumb. */
  readonly label = input<string>('Value');
  /** Accessible names for the range thumbs. */
  readonly rangeLabels = input<[string, string]>(['Minimum', 'Maximum']);

  /** Index of the thumb being dragged, or null. */
  dragging: number | null = null;

  readonly thumbs = computed<SliderThumb[]>(() => {
    const min = this.min();
    const max = this.max();
    if (this.mode() === 'single') {
      const value = this.clamp(this.value(), min, max);
      return [{ index: 0, value, percent: this.percent(value), min, max, label: this.label() }];
    }
    const [a, b] = this.range();
    const start = this.clamp(Math.min(a, b), min, max);
    const end = this.clamp(Math.max(a, b), min, max);
    const labels = this.rangeLabels();
    return [
      { index: 0, value: start, percent: this.percent(start), min, max: end, label: labels[0] },
      { index: 1, value: end, percent: this.percent(end), min: start, max, label: labels[1] },
    ];
  });

  readonly fillStart = computed(() => (this.mode() === 'single' ? 0 : this.thumbs()[0].percent));
  readonly fillWidth = computed(() => {
    const thumbs = this.thumbs();
    return this.mode() === 'single' ? thumbs[0].percent : thumbs[1].percent - thumbs[0].percent;
  });

  private _prevSize: NgAtomsSliderSize = 'md';

  constructor() {
    effect(() => {
      const s = this.size();
      this.renderer.removeClass(this.el.nativeElement, `nga-slider--${this._prevSize}`);
      this.renderer.addClass(this.el.nativeElement, `nga-slider--${s}`);
      this._prevSize = s;
    });
  }

  /**
   * Starts a drag. The thumb closest to the press is taken; when both are
   * equally close, the one the pointer can move away from the other.
   */
  onPointerDown(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    event.preventDefault();

    const raw = this.valueFromPointer(event);
    const thumbs = this.thumbs();
    let index = 0;
    if (thumbs.length === 2) {
      const d0 = Math.abs(raw - thumbs[0].value);
      const d1 = Math.abs(raw - thumbs[1].value);
      index = d0 < d1 ? 0 : d1 < d0 ? 1 : raw > thumbs[1].value ? 1 : 0;
    }

    this.dragging = index;
    this.track().nativeElement.setPointerCapture(event.pointerId);
    this.setThumb(index, raw);
    this.focusThumb(index);
  }

  /** Moves the dragged thumb. */
  onPointerMove(event: PointerEvent): void {
    if (this.dragging === null) return;
    this.setThumb(this.dragging, this.valueFromPointer(event));
  }

  /** Ends the drag. */
  onPointerUp(event: PointerEvent): void {
    if (this.dragging === null) return;
    this.dragging = null;
    const track = this.track().nativeElement;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  }

  /**
   * Arrow keys move a thumb by one step, Page Up and Page Down by a tenth of the
   * range, Home and End to its bounds.
   */
  onKeydown(event: KeyboardEvent, thumb: SliderThumb): void {
    if (this.disabled()) return;
    const step = this.step();
    const big = Math.max(step, (this.max() - this.min()) / 10);

    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = thumb.value + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = thumb.value - step;
        break;
      case 'PageUp':
        next = thumb.value + big;
        break;
      case 'PageDown':
        next = thumb.value - big;
        break;
      case 'Home':
        next = thumb.min;
        break;
      case 'End':
        next = thumb.max;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.setThumb(thumb.index, next);
  }

  /** Sets the value of a thumb, snapped to the step and kept within the thumb's bounds. */
  private setThumb(index: number, raw: number): void {
    const thumb = this.thumbs()[index];
    const next = this.clamp(this.snap(raw), thumb.min, thumb.max);
    if (next === thumb.value) return;

    if (this.mode() === 'single') {
      this.value.set(next);
    } else {
      const thumbs = this.thumbs();
      this.range.set(index === 0 ? [next, thumbs[1].value] : [thumbs[0].value, next]);
    }
  }

  /** Focuses a thumb. */
  private focusThumb(index: number): void {
    const thumbs = this.el.nativeElement.querySelectorAll('.nga-slider__thumb');
    (thumbs[index] as HTMLElement | undefined)?.focus();
  }

  /** The value under the pointer along the track. */
  private valueFromPointer(event: PointerEvent): number {
    const rect = this.track().nativeElement.getBoundingClientRect();
    const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    return this.min() + this.clamp(ratio, 0, 1) * (this.max() - this.min());
  }

  /** Rounds a value to the nearest step. */
  private snap(raw: number): number {
    const step = this.step();
    if (step <= 0) return raw;
    const snapped = this.min() + Math.round((raw - this.min()) / step) * step;
    const decimals = (String(step).split('.')[1] ?? '').length;
    return +snapped.toFixed(decimals);
  }

  /** Position of a value along the track, in percent. */
  private percent(value: number): number {
    const span = this.max() - this.min();
    return span > 0 ? ((value - this.min()) / span) * 100 : 0;
  }

  /** Restricts a number to the inclusive range `[min, max]`. */
  private clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }
}
