import { InjectionToken, Signal } from '@angular/core';

export type NgAtomsStepperOrientation = 'horizontal' | 'vertical';
export type NgAtomsStepState = 'pending' | 'active' | 'complete' | 'error';

/** What a step needs from its parent stepper. */
export interface NgAtomsStepperContext {
  readonly activeStep: Signal<number>;
  readonly clickable: Signal<boolean>;
  indexOf(step: NgAtomsStepRef): number;
  goTo(index: number): void;
}

/** What the stepper needs from each step. */
export interface NgAtomsStepRef {
  readonly disabled: Signal<boolean>;
}

export const NGA_STEPPER = new InjectionToken<NgAtomsStepperContext>('NGA_STEPPER');
export const NGA_STEP = new InjectionToken<NgAtomsStepRef>('NGA_STEP');
