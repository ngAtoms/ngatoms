/**
 * @file Specs for the top layer of the overlay panels. With the Popover API
 * (stubbed here) the select, date picker, popover and dropdown menu show
 * their panel in the top layer and take it out on close, and the panel stays
 * inside its component. Without the API the panel opens in place and still
 * works inside a modal dialog: a pick by mouse or keyboard, and an Escape that
 * closes only the panel.
 */

import { Component, Type, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NgAtomsDatePickerComponent } from '../date-picker/date-picker.component';
import { NgAtomsDialogComponent } from '../dialog/dialog.component';
import { NgAtomsDropdownMenuComponent } from '../dropdown-menu/dropdown-menu.component';
import { NgAtomsDropdownTriggerDirective } from '../dropdown-menu/dropdown-trigger.directive';
import { NgAtomsPopoverComponent } from '../popover/popover.component';
import { NgAtomsPopoverTriggerDirective } from '../popover/popover-trigger.directive';
import { NgAtomsSelectComponent, NgAtomsSelectOption } from '../select/select.component';

const OPTIONS: NgAtomsSelectOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
];

@Component({
  standalone: true,
  imports: [NgAtomsSelectComponent, NgAtomsDatePickerComponent, NgAtomsPopoverComponent, NgAtomsPopoverTriggerDirective, NgAtomsDropdownMenuComponent, NgAtomsDropdownTriggerDirective],
  template: `
    <nga-select [options]="options" />
    <nga-date-picker />
    <nga-popover><button ngAtomsPopoverTrigger>Open</button><p>Content</p></nga-popover>
    <nga-dropdown-menu><button ngAtomsDropdownTrigger>Menu</button></nga-dropdown-menu>
  `,
})
class AllHost {
  readonly options = OPTIONS;
}

@Component({
  standalone: true,
  imports: [NgAtomsDialogComponent, NgAtomsSelectComponent],
  template: `<nga-dialog [(open)]="open"><nga-select [options]="options" [(value)]="value" /></nga-dialog>`,
})
class DialogHost {
  readonly options = OPTIONS;
  readonly open = signal(true);
  readonly value = signal<string | string[] | null>(null);
}

/** Renders a host in the document and lets its effects and first render run. */
async function mount<T>(host: Type<T>): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({ imports: [host] });
  const fixture = TestBed.createComponent(host);
  document.body.appendChild(fixture.nativeElement);
  await settle(fixture);
  return fixture;
}

/** Runs change detection until the fixture is stable, then one more tick for deferred work. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise(resolve => setTimeout(resolve));
}

/** A cancelable Escape keydown that bubbles, as the browser sends it. */
const escape = () => new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
const dialogProto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;

/** Panels in the stubbed top layer; a panel removed from the document leaves it, as in the browser. */
const topLayer = new Set<Element>();

describe('overlay top layer — with the Popover API', () => {
  const matches = Element.prototype.matches;

  beforeEach(() => {
    proto['showPopover'] = function (this: HTMLElement) { topLayer.add(this); };
    proto['hidePopover'] = function (this: HTMLElement) { topLayer.delete(this); };
    Element.prototype.matches = function (this: Element, selector: string): boolean {
      return selector === ':popover-open' ? topLayer.has(this) : matches.call(this, selector);
    } as typeof matches;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    delete proto['showPopover'];
    delete proto['hidePopover'];
    Element.prototype.matches = matches;
    topLayer.clear();
    document.body.replaceChildren();
  });

  it('shows each of the four panels in the top layer, inside its component, and takes it out on close', async () => {
    const fixture = await mount(AllHost);
    const host = fixture.nativeElement as HTMLElement;
    const cases: [string, string, string][] = [
      ['nga-select', '.nga-select-trigger', '.nga-select-panel'],
      ['nga-date-picker', '.nga-date-picker-trigger', '.nga-date-picker-panel'],
      ['nga-popover', '[ngAtomsPopoverTrigger]', '.nga-popover-panel'],
      ['nga-dropdown-menu', '[ngAtomsDropdownTrigger]', '.nga-dropdown-panel'],
    ];
    for (const [selector, trigger, panelSelector] of cases) {
      const component = host.querySelector(selector) as HTMLElement;
      (component.querySelector(trigger) as HTMLElement).click();
      await settle(fixture);
      const panel = component.querySelector(panelSelector) as HTMLElement;
      expect(panel, `${selector} panel inside its component`).not.toBeNull();
      expect(panel.getAttribute('popover'), selector).toBe('manual');
      expect(topLayer.has(panel), `${selector} in the top layer`).toBe(true);

      window.dispatchEvent(escape());
      await settle(fixture);
      expect(panel.isConnected && topLayer.has(panel), `${selector} out of the top layer`).toBe(false);
    }
  });
});

describe('overlay top layer — without the Popover API', () => {
  const saved = proto['showPopover'];

  beforeEach(() => {
    delete proto['showPopover'];
    dialogProto['showModal'] = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
    dialogProto['close'] = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    if (saved) proto['showPopover'] = saved;
    delete dialogProto['showModal'];
    delete dialogProto['close'];
    document.body.replaceChildren();
  });

  it('opens a select in place inside an open dialog, picks with the mouse and the keyboard, and Escape closes only the panel', async () => {
    expect('showPopover' in HTMLElement.prototype).toBe(false);
    const fixture = await mount(DialogHost);
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    const trigger = dialog.querySelector('.nga-select-trigger') as HTMLButtonElement;
    expect(dialog.open).toBe(true);

    trigger.click();
    await settle(fixture);
    let panel = dialog.querySelector('.nga-select-panel') as HTMLElement;
    expect(panel, 'panel in place inside the dialog').not.toBeNull();
    expect(panel.hasAttribute('popover')).toBe(false);
    (panel.querySelectorAll('.nga-select-option')[1] as HTMLElement).click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBe('b');
    expect(dialog.querySelector('.nga-select-panel')).toBeNull();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await settle(fixture);
    panel = dialog.querySelector('.nga-select-panel') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBe('a');

    trigger.click();
    await settle(fixture);
    panel = dialog.querySelector('.nga-select-panel') as HTMLElement;
    const first = escape();
    panel.dispatchEvent(first);
    await settle(fixture);
    expect(first.defaultPrevented, 'the first Escape is kept from the dialog').toBe(true);
    expect(dialog.querySelector('.nga-select-panel')).toBeNull();
    expect(dialog.open).toBe(true);

    const second = escape();
    trigger.dispatchEvent(second);
    expect(second.defaultPrevented, 'the second Escape is left to the dialog').toBe(false);
  });
});
