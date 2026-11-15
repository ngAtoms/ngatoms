/**
 * @file Number input with increment and decrement buttons.
 */

import { Component, ElementRef, Renderer2, computed, effect, inject, input, model } from '@angular/core';

export type NgAtomsNumberInputSize = 'sm' | 'md' | 'lg';

/** Number input with increment and decrement buttons. */
@Component({
  selector: 'nga-number-input',
  standalone: true,
  templateUrl: './number-input.component.html',
  host: { class: 'nga-number-input' },
})
export class NgAtomsNumberInputComponent {
  private readonly el       = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly value    = model<number>(0);
  readonly min      = input<number>(-Infinity);
  readonly max      = input<number>(Infinity);
  readonly step     = input<number>(1);
  readonly size     = input<NgAtomsNumberInputSize>('md');
  readonly disabled = input<boolean>(false);
  readonly invalid  = input<boolean>(false);

  private _prevSize: NgAtomsNumberInputSize = 'md';

  readonly canDecrement = computed(() => this.value() - this.step() >= this.min());
  readonly canIncrement = computed(() => this.value() + this.step() <= this.max());

  constructor() {
    effect(() => {
      const s = this.size();
      this.renderer.removeClass(this.el.nativeElement, `nga-number-input--${this._prevSize}`);
      this.renderer.addClass(this.el.nativeElement, `nga-number-input--${s}`);
      this._prevSize = s;
    });
  }

  /** Adds one step, when the maximum allows. */
  increment(): void {
    if (this.disabled() || !this.canIncrement()) return;
    this.value.set(this.round(this.value() + this.step()));
  }

  /** Subtracts one step, when the minimum allows. */
  decrement(): void {
    if (this.disabled() || !this.canDecrement()) return;
    this.value.set(this.round(this.value() - this.step()));
  }

  /** Takes a typed number, kept within the minimum and maximum. */
  onInput(event: Event): void {
    const raw = +(event.target as HTMLInputElement).value;
    if (!isNaN(raw)) {
      this.value.set(Math.min(this.max(), Math.max(this.min(), this.round(raw))));
    }
  }

  /** Rounds to the number of decimals the step has, which removes floating-point noise. */
  private round(n: number): number {
    const decimals = (String(this.step()).split('.')[1] ?? '').length;
    return +n.toFixed(decimals);
  }
}
