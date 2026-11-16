/**
 * @file Popover and dropdown menu now place their panel with the shared
 * `computeOverlayPosition`. These specs compare the result with a copy of the
 * placement each component had before (rc.6), over every placement, the
 * alignments of the menu, a flip, and the clamp when neither side fits.
 */

import { Component, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';
import { NgAtomsDropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';
import { NgAtomsDropdownTriggerDirective } from '../dropdown-menu/dropdown-trigger.directive';
import { NgAtomsPopoverComponent } from '../popover/popover.component';
import { NgAtomsPopoverTriggerDirective } from '../popover/popover-trigger.directive';

type Placement = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';
interface Box { top: number; left: number; width: number; height: number }

const OPPOSITE: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/** The placement both components used before the shared helper (rc.6), kept as the reference. */
function before(p: Placement, a: Align, trigger: Box, panel: Box, gap: number, margin: number) {
  const tr = { ...trigger, right: trigger.left + trigger.width, bottom: trigger.top + trigger.height };
  const coords = (side: Placement) => {
    if (side === 'left' || side === 'right') {
      const left = side === 'left' ? tr.left - panel.width - gap : tr.right + gap;
      const top = a === 'start' ? tr.top : a === 'end' ? tr.bottom - panel.height : tr.top + tr.height / 2 - panel.height / 2;
      return { top, left };
    }
    const top = side === 'bottom' ? tr.bottom + gap : tr.top - panel.height - gap;
    const left = a === 'start' ? tr.left : a === 'end' ? tr.right - panel.width : tr.left + tr.width / 2 - panel.width / 2;
    return { top, left };
  };
  const fits = (c: { top: number; left: number }) =>
    c.top >= margin && c.left >= margin && c.top + panel.height <= innerHeight - margin && c.left + panel.width <= innerWidth - margin;
  const preferred = coords(p);
  if (fits(preferred)) return { ...preferred, placement: p };
  const fallback = coords(OPPOSITE[p]);
  if (fits(fallback)) return { ...fallback, placement: OPPOSITE[p] };
  return {
    top: Math.max(margin, Math.min(preferred.top, innerHeight - panel.height - margin)),
    left: Math.max(margin, Math.min(preferred.left, innerWidth - panel.width - margin)),
    placement: p,
  };
}

/** A DOMRect for a box. The panel reports the box at its own fixed coordinates, as with the viewport holding it. */
const rect = (box: Box) =>
  ({ ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => box }) as DOMRect;

@Component({
  standalone: true,
  imports: [NgAtomsPopoverComponent, NgAtomsPopoverTriggerDirective],
  template: `<nga-popover [placement]="placement()"><button ngAtomsPopoverTrigger>Open</button><p>Content</p></nga-popover>`,
})
class PopoverHost {
  readonly placement = signal<Placement>('bottom');
}

@Component({
  standalone: true,
  imports: [NgAtomsDropdownMenuComponent, NgAtomsDropdownTriggerDirective],
  template: `<nga-dropdown-menu [placement]="placement()" [align]="align()"><button ngAtomsDropdownTrigger>Menu</button></nga-dropdown-menu>`,
})
class MenuHost {
  readonly placement = signal<Placement>('bottom');
  readonly align = signal<Align>('start');
}

/** Waits two frames: the components place the panel in a requestAnimationFrame. */
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Opens a component with the trigger and panel at given boxes and returns
 * where it put the panel and on which side.
 */
async function place<T>(
  host: Type<T>,
  component: Type<{ toggle(): void; activePlacement(): Placement; panelEl(): { nativeElement: HTMLElement } }>,
  setUp: (host: T) => void,
  trigger: Box,
  panel: Box,
): Promise<{ top: number; left: number; placement: Placement }> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [host] });
  const fixture = TestBed.createComponent(host);
  setUp(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  const debug = fixture.debugElement.query(By.directive(component));
  const instance = debug.componentInstance;
  (debug.nativeElement as HTMLElement).getBoundingClientRect = () => rect(trigger);
  const panelElement: HTMLElement = instance.panelEl().nativeElement;
  panelElement.getBoundingClientRect = () =>
    rect({ ...panel, top: parseFloat(panelElement.style.top) || 0, left: parseFloat(panelElement.style.left) || 0 });
  instance.toggle();
  fixture.detectChanges();
  await frames();
  const element = instance.panelEl().nativeElement;
  const result = { top: parseFloat(element.style.top), left: parseFloat(element.style.left), placement: instance.activePlacement() };
  fixture.destroy();
  return result;
}

const PANEL: Box = { top: 0, left: 0, width: 200, height: 120 };
const TRIGGERS: Record<string, Box> = {
  middle: { top: 300, left: 400, width: 100, height: 36 },
  nearTop: { top: 20, left: 400, width: 100, height: 36 },
  nearLeft: { top: 300, left: 20, width: 100, height: 36 },
  nearBottomRight: { top: 700, left: 900, width: 100, height: 36 },
};
const PLACEMENTS: Placement[] = ['top', 'bottom', 'left', 'right'];

describe('overlay placement parity with rc.6', () => {
  afterEach(() => {
    document.querySelectorAll('.nga-popover-panel, .nga-dropdown-panel').forEach(element => element.remove());
  });

  it('popover lands where it did before, for every placement, with flips and the clamp', async () => {
    for (const [name, trigger] of Object.entries(TRIGGERS)) {
      for (const placement of PLACEMENTS) {
        const got = await place(PopoverHost, NgAtomsPopoverComponent as never, host => host.placement.set(placement), trigger, PANEL);
        expect(got, `${name} ${placement}`).toEqual(before(placement, 'center', trigger, PANEL, 8, 8));
      }
    }
    const huge: Box = { top: 0, left: 0, width: 2000, height: 2000 };
    const clamped = await place(PopoverHost, NgAtomsPopoverComponent as never, host => host.placement.set('bottom'), TRIGGERS['middle'], huge);
    expect(clamped).toEqual(before('bottom', 'center', TRIGGERS['middle'], huge, 8, 8));
  });

  it('dropdown menu lands where it did before, for every placement and alignment', async () => {
    for (const [name, trigger] of Object.entries(TRIGGERS)) {
      for (const placement of PLACEMENTS) {
        for (const align of ['start', 'center', 'end'] as Align[]) {
          const got = await place(
            MenuHost,
            NgAtomsDropdownMenuComponent as never,
            host => {
              host.placement.set(placement);
              host.align.set(align);
            },
            trigger,
            PANEL,
          );
          expect(got, `${name} ${placement} ${align}`).toEqual(before(placement, align, trigger, PANEL, 4, 8));
        }
      }
    }
  });
});
