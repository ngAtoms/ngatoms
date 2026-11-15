/**
 * @file Timeline: the list, its events and the parts of an event.
 */

import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

export type NgAtomsTimelineItemStatus = 'default' | 'active' | 'complete';

/** Timeline: a vertical list of events. */
@Directive({ selector: '[ngAtomsTimeline]', standalone: true, host: { class: 'nga-timeline' } })
export class NgAtomsTimelineDirective {}

/** One event of a timeline. */
@Directive({
  selector: '[ngAtomsTimelineItem]',
  standalone: true,
  host: { class: 'nga-timeline-item' },
})
export class NgAtomsTimelineItemDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly status = input<NgAtomsTimelineItemStatus>('default');

  private _prevStatus: NgAtomsTimelineItemStatus = 'default';

  constructor() {
    effect(() => {
      const s = this.status();
      this.renderer.removeClass(this.el.nativeElement, `nga-timeline-item--${this._prevStatus}`);
      this.renderer.addClass(this.el.nativeElement, `nga-timeline-item--${s}`);
      this._prevStatus = s;
    });
  }
}

/** The dot or icon marking an event. */
@Directive({
  selector: '[ngAtomsTimelineMarker]',
  standalone: true,
  host: { class: 'nga-timeline-marker', 'aria-hidden': 'true' },
})
export class NgAtomsTimelineMarkerDirective {}

/** Content of an event. */
@Directive({ selector: '[ngAtomsTimelineContent]', standalone: true, host: { class: 'nga-timeline-content' } })
export class NgAtomsTimelineContentDirective {}

/** Title of an event. */
@Directive({ selector: '[ngAtomsTimelineTitle]', standalone: true, host: { class: 'nga-timeline-title' } })
export class NgAtomsTimelineTitleDirective {}

/** When an event happened. */
@Directive({ selector: '[ngAtomsTimelineTime]', standalone: true, host: { class: 'nga-timeline-time' } })
export class NgAtomsTimelineTimeDirective {}

/** Description of an event. */
@Directive({
  selector: '[ngAtomsTimelineDescription]',
  standalone: true,
  host: { class: 'nga-timeline-description' },
})
export class NgAtomsTimelineDescriptionDirective {}
