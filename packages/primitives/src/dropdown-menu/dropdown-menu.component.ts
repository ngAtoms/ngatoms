import {
  Component,
  ElementRef,
  HostListener,
  InjectionToken,
  OnDestroy,
  Renderer2,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgAtomsOverlayService } from '../overlay/overlay.service';
import {
  NgAtomsOverlayAlign,
  NgAtomsOverlayPlacement,
  computeOverlayPosition,
} from '../overlay/position';

export type NgAtomsDropdownPlacement = NgAtomsOverlayPlacement;
export type NgAtomsDropdownAlign = NgAtomsOverlayAlign;

export interface NgAtomsDropdownMenuContext {
  open: ReturnType<typeof model<boolean>>;
  close(): void;
  focusFirst(): void;
  focusLast(): void;
  focusNext(current: HTMLElement): void;
  focusPrev(current: HTMLElement): void;
}

export const NGA_DROPDOWN_MENU = new InjectionToken<NgAtomsDropdownMenuContext>('NGA_DROPDOWN_MENU');

@Component({
  selector: 'nga-dropdown-menu',
  standalone: true,
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.css',
  host: { class: 'nga-dropdown-root' },
  providers: [{ provide: NGA_DROPDOWN_MENU, useExisting: NgAtomsDropdownMenuComponent }],
})
export class NgAtomsDropdownMenuComponent implements NgAtomsDropdownMenuContext, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly overlay = inject(NgAtomsOverlayService);

  readonly open = model<boolean>(false);
  readonly placement = input<NgAtomsDropdownPlacement>('bottom');
  readonly align = input<NgAtomsDropdownAlign>('start');
  readonly activePlacement = signal<NgAtomsDropdownPlacement>('bottom');

  readonly panelEl = viewChild.required<ElementRef<HTMLElement>>('panelEl');

  private deregister: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) this.activePlacement.set(this.placement());
    });
    effect(() => {
      if (this.open()) {
        this.deregister = this.overlay.register(
          () => this.open.set(false),
          [this.el.nativeElement, this.panelEl().nativeElement],
          { closeOnScroll: false }
        );
      } else {
        this.deregister?.();
        this.deregister = null;
      }
    });
    afterNextRender(() => {
      this.renderer.appendChild(this.document.body, this.panelEl().nativeElement);
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.open()) {
      this.position();
    }
  }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      requestAnimationFrame(() => {
        this.position();
        this.focusFirst();
      });
    }
  }

  openAndFocusLast(): void {
    this.open.set(true);
    requestAnimationFrame(() => {
      this.position();
      this.focusLast();
    });
  }

  close(): void {
    this.open.set(false);
  }

  private items(): HTMLElement[] {
    return Array.from(
      this.panelEl().nativeElement.querySelectorAll<HTMLElement>(
        '.nga-dropdown-item:not([aria-disabled="true"])',
      ),
    );
  }

  focusFirst(): void {
    this.items()[0]?.focus();
  }

  focusLast(): void {
    const items = this.items();
    items[items.length - 1]?.focus();
  }

  focusNext(current: HTMLElement): void {
    const items = this.items();
    const idx = items.indexOf(current);
    items[(idx + 1) % items.length]?.focus();
  }

  focusPrev(current: HTMLElement): void {
    const items = this.items();
    const idx = items.indexOf(current);
    items[(idx - 1 + items.length) % items.length]?.focus();
  }

  private position(): void {
    const panel = this.panelEl().nativeElement;
    const pos = computeOverlayPosition(
      this.el.nativeElement.getBoundingClientRect(),
      panel.getBoundingClientRect(),
      { placement: this.placement(), align: this.align(), gap: 4, margin: 8 },
    );

    this.activePlacement.set(pos.placement);
    this.renderer.setStyle(panel, 'top', `${pos.top}px`);
    this.renderer.setStyle(panel, 'left', `${pos.left}px`);
  }

  ngOnDestroy(): void {
    this.deregister?.();
    const panel = this.panelEl().nativeElement;
    if (panel.parentElement === this.document.body) {
      this.renderer.removeChild(this.document.body, panel);
    }
  }
}