import {
  Component,
  ElementRef,
  Renderer2,
  contentChildren,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import {
  NGA_STEP,
  NGA_STEPPER,
  NgAtomsStepRef,
  NgAtomsStepperContext,
  NgAtomsStepperOrientation,
} from './stepper.context';

@Component({
  selector: 'nga-stepper',
  standalone: true,
  template: `<ng-content />`,
  host: {
    class: 'nga-stepper',
    role: 'list',
    '[attr.aria-label]': 'label()',
  },
  providers: [{ provide: NGA_STEPPER, useExisting: NgAtomsStepperComponent }],
})
export class NgAtomsStepperComponent implements NgAtomsStepperContext {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  /** Index of the current step, 0-based. Steps before it render as complete. */
  readonly activeStep = model<number>(0);
  readonly orientation = input<NgAtomsStepperOrientation>('horizontal');
  /** Lets the user jump to a step by clicking it. */
  readonly clickable = input<boolean>(false);
  readonly label = input<string>('Progress');

  readonly steps = contentChildren<NgAtomsStepRef>(NGA_STEP);

  private _prevOrientation: NgAtomsStepperOrientation = 'horizontal';

  constructor() {
    effect(() => {
      const o = this.orientation();
      this.renderer.removeClass(this.el.nativeElement, `nga-stepper--${this._prevOrientation}`);
      this.renderer.addClass(this.el.nativeElement, `nga-stepper--${o}`);
      this._prevOrientation = o;
    });
  }

  indexOf(step: NgAtomsStepRef): number {
    return this.steps().indexOf(step);
  }

  goTo(index: number): void {
    const step = this.steps()[index];
    if (!step || step.disabled()) return;
    this.activeStep.set(index);
  }

  next(): void {
    this.goTo(Math.min(this.steps().length - 1, this.activeStep() + 1));
  }

  previous(): void {
    this.goTo(Math.max(0, this.activeStep() - 1));
  }
}
