/**
 * @file One step of a stepper.
 */

import { Component, computed, inject, input } from '@angular/core';
import { NGA_STEP, NGA_STEPPER, NgAtomsStepRef, NgAtomsStepState } from './stepper.context';

/** One step of a stepper. */
@Component({
  selector: 'nga-step',
  standalone: true,
  templateUrl: './step.component.html',
  host: {
    class: 'nga-step',
    role: 'listitem',
    '[class.nga-step--pending]': 'state() === "pending"',
    '[class.nga-step--active]': 'state() === "active"',
    '[class.nga-step--complete]': 'state() === "complete"',
    '[class.nga-step--error]': 'state() === "error"',
    '[class.nga-step--disabled]': 'disabled()',
  },
  providers: [{ provide: NGA_STEP, useExisting: NgAtomsStepComponent }],
})
export class NgAtomsStepComponent implements NgAtomsStepRef {
  readonly stepper = inject(NGA_STEPPER);

  readonly label = input.required<string>();
  readonly description = input<string>('');
  /** Marks the step as failed, overriding the active/complete look. */
  readonly error = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly index = computed(() => this.stepper.indexOf(this));

  readonly state = computed<NgAtomsStepState>(() => {
    if (this.error()) return 'error';
    const active = this.stepper.activeStep();
    const index = this.index();
    return index < active ? 'complete' : index === active ? 'active' : 'pending';
  });

  /** Screen-reader suffix, since the indicator glyph alone is not announced. */
  readonly stateLabel = computed(() => {
    switch (this.state()) {
      case 'complete': return 'completed';
      case 'error':    return 'error';
      case 'active':   return 'current';
      default:         return 'not started';
    }
  });

  /** Makes this the active step, when the stepper lets steps be clicked. */
  activate(): void {
    if (!this.stepper.clickable()) return;
    this.stepper.goTo(this.index());
  }
}
