/**
 * @file Specs for the date picker calendar: open on creation, and how Escape
 * and a click outside close it.
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { NgAtomsDatePickerComponent } from './date-picker.component';

@Component({
  standalone: true,
  imports: [NgAtomsDatePickerComponent],
  template: `<nga-date-picker [defaultOpen]="open()" />`,
})
class PickerHost {
  readonly open = signal(true);
}

/** Renders the host and returns it with the trigger. */
async function mount(open = true): Promise<{ fixture: ComponentFixture<PickerHost>; trigger: HTMLButtonElement }> {
  TestBed.configureTestingModule({ imports: [PickerHost] });
  const fixture = TestBed.createComponent(PickerHost);
  fixture.componentInstance.open.set(open);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector('.nga-date-picker-trigger') as HTMLButtonElement;
  return { fixture, trigger };
}

/** Whether the calendar is open. */
const isOpen = () => document.querySelector('.nga-date-picker-panel--open') !== null;

/** Lets the deferred focus and listeners of the picker run. */
const nextTick = () => new Promise(resolve => setTimeout(resolve));

describe('NgAtomsDatePickerComponent — overlay', () => {
  afterEach(() => {
    document.querySelectorAll('.nga-date-picker-panel').forEach(element => element.remove());
  });

  it('opens on creation with defaultOpen', async () => {
    await mount(true);
    expect(isOpen()).toBe(true);
  });

  it('stays closed without defaultOpen', async () => {
    await mount(false);
    expect(isOpen()).toBe(false);
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const { fixture, trigger } = await mount(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    await nextTick();
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a click outside without moving focus to the trigger', async () => {
    const { fixture, trigger } = await mount(true);
    await nextTick();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    await nextTick();
    expect(isOpen()).toBe(false);
    expect(document.activeElement).not.toBe(trigger);
    outside.remove();
  });
});
