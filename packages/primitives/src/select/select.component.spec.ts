/**
 * @file Specs for the select panel: open on creation, kept inside the
 * component, and how Escape and a click outside close it.
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { NgAtomsSelectComponent, NgAtomsSelectOption } from './select.component';

const OPTIONS: NgAtomsSelectOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
];

@Component({
  standalone: true,
  imports: [NgAtomsSelectComponent],
  template: `<nga-select [options]="options" [defaultOpen]="open()" />`,
})
class SelectHost {
  readonly options = OPTIONS;
  readonly open = signal(true);
}

/** Renders the host, lets the panel open, and returns it with the trigger. */
async function mount(open = true): Promise<{ fixture: ComponentFixture<SelectHost>; trigger: HTMLButtonElement }> {
  TestBed.configureTestingModule({ imports: [SelectHost] });
  const fixture = TestBed.createComponent(SelectHost);
  fixture.componentInstance.open.set(open);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector('.nga-select-trigger') as HTMLButtonElement;
  return { fixture, trigger };
}

/** The open panel, wherever it is in the document. */
const panel = () => document.querySelector<HTMLElement>('.nga-select-panel');

describe('NgAtomsSelectComponent — overlay', () => {
  afterEach(() => {
    document.querySelectorAll('.nga-select-panel').forEach(element => element.remove());
  });

  it('opens on creation with defaultOpen, with the panel kept inside the component', async () => {
    const { fixture } = await mount(true);
    expect(panel()).not.toBeNull();
    expect(fixture.nativeElement.querySelector('nga-select').contains(panel())).toBe(true);
  });

  it('stays closed without defaultOpen', async () => {
    await mount(false);
    expect(panel()).toBeNull();
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const { fixture, trigger } = await mount(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a click outside without moving focus to the trigger', async () => {
    const { fixture, trigger } = await mount(true);
    await new Promise(resolve => setTimeout(resolve));
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).not.toBe(trigger);
    outside.remove();
  });

  it('leaves Escape on a closed select to its container', async () => {
    const { trigger } = await mount(false);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    trigger.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
