/**
 * @file Alert: the box, its title and its description.
 */

import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';

export type NgAtomsAlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

/** Alert box, styled by variant. */
@Directive({
  selector: '[ngAtomsAlert]',
  standalone: true,
  host: { class: 'nga-alert', role: 'alert' },
})
export class NgAtomsAlertDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly variant = input<NgAtomsAlertVariant>('default');

  private _prevVariant: NgAtomsAlertVariant = 'default';

  constructor() {
    effect(() => {
      const v = this.variant();
      this.renderer.removeClass(this.el.nativeElement, `nga-alert--${this._prevVariant}`);
      this.renderer.addClass(this.el.nativeElement, `nga-alert--${v}`);
      this._prevVariant = v;
    });
  }

}

/** Title of an alert. */
@Directive({
  selector: '[ngAtomsAlertTitle]',
  standalone: true,
  host: { class: 'nga-alert-title' },
})
export class NgAtomsAlertTitleDirective {}

/** Description of an alert. */
@Directive({
  selector: '[ngAtomsAlertDescription]',
  standalone: true,
  host: { class: 'nga-alert-description' },
})
export class NgAtomsAlertDescriptionDirective {}
