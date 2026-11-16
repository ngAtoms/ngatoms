/**
 * @file Specs for tabs keyboard navigation.
 */

import { Component, Type, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgAtomsTabListDirective } from './tab-list.directive';
import { NgAtomsTabPanelDirective } from './tab-panel.directive';
import { NgAtomsTabTriggerDirective } from './tab-trigger.directive';
import { NgAtomsTabsComponent } from './tabs.component';

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective, NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: `
    <nga-tabs defaultValue="two">
      <div ngAtomsTabList>
        <button ngAtomsTabTrigger value="one">One</button>
        <button ngAtomsTabTrigger value="two">Two</button>
        <button ngAtomsTabTrigger value="three">Three</button>
      </div>
      <div ngAtomsTabPanel value="one">Panel one</div>
      <div ngAtomsTabPanel value="two">Panel two</div>
      <div ngAtomsTabPanel value="three">Panel three</div>
    </nga-tabs>
  `,
})
class TabsHost {}

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective, NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: `
    <nga-tabs>
      <div ngAtomsTabList>
        <button ngAtomsTabTrigger value="zero" disabled>Zero</button>
        <button ngAtomsTabTrigger value="one">One</button>
        <button ngAtomsTabTrigger value="two" disabled>Two</button>
        <button ngAtomsTabTrigger value="three">Three</button>
        <button ngAtomsTabTrigger value="four" disabled>Four</button>
      </div>
      <div ngAtomsTabPanel value="one">Panel one</div>
      <div ngAtomsTabPanel value="three">Panel three</div>
    </nga-tabs>
  `,
})
class DisabledTabsHost {}

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective, NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: `
    <nga-tabs>
      <div ngAtomsTabList>
        <button ngAtomsTabTrigger value="one">One</button>
        <button ngAtomsTabTrigger value="two" [disabled]="twoDisabled()">Two</button>
        <button ngAtomsTabTrigger value="three">Three</button>
      </div>
      <div ngAtomsTabPanel value="one">Panel one</div>
      <div ngAtomsTabPanel value="two">Panel two</div>
      <div ngAtomsTabPanel value="three">Panel three</div>
    </nga-tabs>
  `,
})
class RuntimeDisabledHost {
  readonly twoDisabled = signal(false);
}

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective, NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: `
    <nga-tabs>
      <div ngAtomsTabList>
        <button ngAtomsTabTrigger value="a">A</button>
        @if (showB()) {
          <button ngAtomsTabTrigger value="b">B</button>
        }
        <button ngAtomsTabTrigger value="c">C</button>
      </div>
    </nga-tabs>
  `,
})
class InsertedTabHost {
  readonly showB = signal(false);
}

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective, NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: `
    <nga-tabs>
      <div ngAtomsTabList>
        @for (name of names(); track name) {
          <button ngAtomsTabTrigger [value]="name">{{ name }}</button>
        }
      </div>
    </nga-tabs>
  `,
})
class ReorderedTabsHost {
  readonly names = signal(['X', 'Y', 'Z']);
}

@Component({
  standalone: true,
  imports: [NgAtomsTabsComponent, NgAtomsTabListDirective, NgAtomsTabTriggerDirective, NgAtomsTabPanelDirective],
  template: `
    <nga-tabs>
      <div ngAtomsTabList>
        @if (showFirst()) {
          <button ngAtomsTabTrigger value="first">First</button>
        }
        <button ngAtomsTabTrigger value="a">A</button>
        <button ngAtomsTabTrigger value="b">B</button>
      </div>
    </nga-tabs>
  `,
})
class LateFirstTabHost {
  readonly showFirst = signal(false);
}

/** Renders a host and returns the fixture with a trigger lookup by its text. */
function mount(
  host: Type<unknown> = TabsHost,
): { fixture: ComponentFixture<unknown>; trigger: (text: string) => HTMLButtonElement } {
  TestBed.configureTestingModule({ imports: [host] });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement);
  const trigger = (text: string) =>
    [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === text,
    ) as HTMLButtonElement;
  return { fixture, trigger };
}

/** Dispatches a keydown on the focused element and renders the result. */
function press(fixture: ComponentFixture<unknown>, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  (document.activeElement as HTMLElement).dispatchEvent(event);
  fixture.detectChanges();
  return event;
}

describe('NgAtomsTabTriggerDirective — keyboard', () => {
  it('activates and focuses the first and last tab with Home and End', () => {
    const { fixture, trigger } = mount();
    trigger('Two').focus();

    press(fixture, { key: 'End' });
    expect(document.activeElement).toBe(trigger('Three'));
    expect(trigger('Three').getAttribute('aria-selected')).toBe('true');

    press(fixture, { key: 'Home' });
    expect(document.activeElement).toBe(trigger('One'));
    expect(trigger('One').getAttribute('aria-selected')).toBe('true');
  });

  it('keeps Arrow Left and Arrow Right wrapping at the ends', () => {
    const { fixture, trigger } = mount();
    trigger('Two').focus();

    press(fixture, { key: 'End' });
    press(fixture, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(trigger('One'));
    press(fixture, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(trigger('Three'));
  });

  it('leaves the keys to the page when Ctrl, Alt, Meta or Shift is held', () => {
    const { fixture, trigger } = mount();
    trigger('Two').focus();
    const selected = () => ['One', 'Two', 'Three'].map(text => trigger(text).getAttribute('aria-selected'));
    const before = selected();

    for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey'] as const) {
      for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
        const event = press(fixture, { key, [modifier]: true });
        expect(document.activeElement, `${modifier}+${key}`).toBe(trigger('Two'));
        expect(event.defaultPrevented, `${modifier}+${key}`).toBe(false);
      }
    }
    expect(selected()).toEqual(before);
  });
});

describe('NgAtomsTabTriggerDirective — disabled tabs', () => {
  /** The disabled triggers never hold the roving tabindex nor the selection. */
  function expectDisabledOut(trigger: (text: string) => HTMLButtonElement): void {
    for (const text of ['Zero', 'Two', 'Four']) {
      expect(trigger(text).getAttribute('tabindex'), text).toBe('-1');
      expect(trigger(text).getAttribute('aria-selected'), text).toBe('false');
    }
  }

  it('starts on the first enabled tab when the first one is disabled', () => {
    const { trigger } = mount(DisabledTabsHost);
    expect(trigger('One').getAttribute('aria-selected')).toBe('true');
    expect(trigger('One').getAttribute('tabindex')).toBe('0');
    expectDisabledOut(trigger);
  });

  it('goes to the first and last enabled tab with Home and End', () => {
    const { fixture, trigger } = mount(DisabledTabsHost);
    trigger('One').focus();

    press(fixture, { key: 'End' });
    expect(document.activeElement).toBe(trigger('Three'));
    expect(trigger('Three').getAttribute('aria-selected')).toBe('true');
    expectDisabledOut(trigger);

    press(fixture, { key: 'Home' });
    expect(document.activeElement).toBe(trigger('One'));
    expect(trigger('One').getAttribute('aria-selected')).toBe('true');
    expectDisabledOut(trigger);
  });

  it('skips disabled tabs with Arrow Left and Arrow Right, wrapping at the ends', () => {
    const { fixture, trigger } = mount(DisabledTabsHost);
    trigger('One').focus();

    press(fixture, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(trigger('Three'));
    press(fixture, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(trigger('One'));
    press(fixture, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(trigger('Three'));
    press(fixture, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(trigger('One'));
    expectDisabledOut(trigger);
  });
});

describe('NgAtomsTabTriggerDirective — active tab disabled at runtime', () => {
  /** Lets the disabled watch see the attribute, then renders the result. */
  async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** `tabindex` of One, Two and Three. */
  const tabStops = (trigger: (text: string) => HTMLButtonElement) =>
    ['One', 'Two', 'Three'].map(text => trigger(text).getAttribute('tabindex'));

  it('moves the tab stop to the first enabled tab and keeps the selection', async () => {
    const { fixture, trigger } = mount(RuntimeDisabledHost);
    trigger('Two').click();
    await settle(fixture);
    expect(tabStops(trigger)).toEqual(['-1', '0', '-1']);

    (fixture.componentInstance as RuntimeDisabledHost).twoDisabled.set(true);
    await settle(fixture);

    expect(trigger('Two').disabled).toBe(true);
    expect(trigger('Two').getAttribute('aria-selected')).toBe('true');
    expect(tabStops(trigger)).toEqual(['0', '-1', '-1']);
  });

  it('gives the tab stop back when the active tab is enabled again', async () => {
    const { fixture, trigger } = mount(RuntimeDisabledHost);
    trigger('Two').click();
    const host = fixture.componentInstance as RuntimeDisabledHost;
    host.twoDisabled.set(true);
    await settle(fixture);
    host.twoDisabled.set(false);
    await settle(fixture);

    expect(tabStops(trigger)).toEqual(['-1', '0', '-1']);
  });

  it('moves on from the tab stop with the arrows, skipping the disabled active tab', async () => {
    const { fixture, trigger } = mount(RuntimeDisabledHost);
    trigger('Two').click();
    (fixture.componentInstance as RuntimeDisabledHost).twoDisabled.set(true);
    await settle(fixture);
    trigger('One').focus();

    press(fixture, { key: 'ArrowRight' });
    await settle(fixture);
    expect(document.activeElement).toBe(trigger('Three'));
    expect(trigger('Three').getAttribute('aria-selected')).toBe('true');
    expect(tabStops(trigger)).toEqual(['-1', '-1', '0']);
  });
});

describe('NgAtomsTabsComponent — keyboard order follows the page', () => {
  /** Renders the change, then the effects it triggers. */
  async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /**
   * Focuses a trigger, makes it active, presses a key and returns the text
   * of the trigger that ends up focused, which must also be the only tab stop.
   */
  async function from(
    fixture: ComponentFixture<unknown>,
    trigger: (text: string) => HTMLButtonElement,
    start: string,
    key: string,
  ): Promise<string> {
    trigger(start).click();
    await settle(fixture);
    trigger(start).focus();
    press(fixture, { key });
    await settle(fixture);
    const focused = (document.activeElement as HTMLElement).textContent?.trim() ?? '';
    const stops = [...fixture.nativeElement.querySelectorAll('[tabindex="0"]')].map(
      (element: HTMLElement) => element.textContent?.trim(),
    );
    expect(stops, `${start} ${key}`).toEqual([focused]);
    return focused;
  }

  it('moves through a tab inserted in the middle by @if in page order', async () => {
    const { fixture, trigger } = mount(InsertedTabHost);
    (fixture.componentInstance as InsertedTabHost).showB.set(true);
    await settle(fixture);

    expect(await from(fixture, trigger, 'A', 'ArrowRight')).toBe('B');
    expect(await from(fixture, trigger, 'B', 'ArrowRight')).toBe('C');
    expect(await from(fixture, trigger, 'A', 'ArrowLeft')).toBe('C');
    expect(await from(fixture, trigger, 'C', 'ArrowLeft')).toBe('B');
    expect(await from(fixture, trigger, 'A', 'End')).toBe('C');
    expect(await from(fixture, trigger, 'C', 'Home')).toBe('A');
  });

  it('keeps the first active tab of registration when a tab is later added before it', async () => {
    const { fixture, trigger } = mount(LateFirstTabHost);
    await settle(fixture);
    expect(trigger('A').getAttribute('aria-selected')).toBe('true');

    (fixture.componentInstance as LateFirstTabHost).showFirst.set(true);
    await settle(fixture);

    const onPage = [...fixture.nativeElement.querySelectorAll('[role="tab"]')].map(
      (element: HTMLElement) => element.textContent?.trim(),
    );
    expect(onPage).toEqual(['First', 'A', 'B']);
    expect(trigger('A').getAttribute('aria-selected')).toBe('true');
    expect(trigger('First').getAttribute('aria-selected')).toBe('false');
    expect(trigger('A').getAttribute('tabindex')).toBe('0');
  });

  it('follows the new order after an @for reorders its tabs', async () => {
    const { fixture, trigger } = mount(ReorderedTabsHost);
    (fixture.componentInstance as ReorderedTabsHost).names.set(['Z', 'Y', 'X']);
    await settle(fixture);
    const onPage = [...fixture.nativeElement.querySelectorAll('[role="tab"]')].map(
      (element: HTMLElement) => element.textContent?.trim(),
    );
    expect(onPage).toEqual(['Z', 'Y', 'X']);

    expect(await from(fixture, trigger, 'Z', 'ArrowRight')).toBe('Y');
    expect(await from(fixture, trigger, 'Z', 'ArrowLeft')).toBe('X');
    expect(await from(fixture, trigger, 'X', 'ArrowRight')).toBe('Z');
    expect(await from(fixture, trigger, 'Y', 'End')).toBe('X');
    expect(await from(fixture, trigger, 'Y', 'Home')).toBe('Z');
  });
});
