import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

export type NgAtomsSkeletonVariant = 'text' | 'circle' | 'rect';

@Directive({
  selector: '[ngAtomsSkeleton]',
  standalone: true,
  host: {
    class: 'nga-skeleton',
    'aria-hidden': 'true',
  },
})
export class NgAtomsSkeletonDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly variant = input<NgAtomsSkeletonVariant>('text');
  readonly animated = input<boolean>(true);

  private _prevVariant: NgAtomsSkeletonVariant = 'text';

  constructor() {
    effect(() => {
      const v = this.variant();
      this.renderer.removeClass(this.el.nativeElement, `nga-skeleton--${this._prevVariant}`);
      this.renderer.addClass(this.el.nativeElement, `nga-skeleton--${v}`);
      this._prevVariant = v;
    });

    effect(() => {
      if (this.animated()) {
        this.renderer.removeClass(this.el.nativeElement, 'nga-skeleton--static');
      } else {
        this.renderer.addClass(this.el.nativeElement, 'nga-skeleton--static');
      }
    });
  }
}
