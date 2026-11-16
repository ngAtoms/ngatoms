/**
 * @file Specs for accordion keyboard navigation between triggers.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgAtomsAccordionComponent } from './accordion.component';
import { NgAtomsAccordionContentDirective } from './accordion-content.directive';
import { NgAtomsAccordionItemComponent } from './accordion-item.component';
import { NgAtomsAccordionTriggerDirective } from './accordion-trigger.directive';

const PARTS = [
  NgAtomsAccordionComponent,
  NgAtomsAccordionItemComponent,
  NgAtomsAccordionTriggerDirective,
  NgAtomsAccordionContentDirective,
];

@Component({
  standalone: true,
  imports: PARTS,
  template: `
    <nga-accordion>
      <nga-accordion-item value="a">
        <button ngAtomsAccordionTrigger>A</button>
        <div ngAtomsAccordionContent>
          <nga-accordion>
            <nga-accordion-item value="inner">
              <button ngAtomsAccordionTrigger>Inner</button>
              <div ngAtomsAccordionContent>Inner content</div>
            </nga-accordion-item>
          </nga-accordion>
        </div>
      </nga-accordion-item>
      <nga-accordion-item value="b">
        <button ngAtomsAccordionTrigger disabled>B</button>
        <div ngAtomsAccordionContent>B content</div>
      </nga-accordion-item>
      <nga-accordion-item value="c">
        <button ngAtomsAccordionTrigger>C</button>
        <div ngAtomsAccordionContent>C content</div>
      </nga-accordion-item>
      <nga-accordion-item value="d">
        <button ngAtomsAccordionTrigger>D</button>
        <div ngAtomsAccordionContent>D content</div>
      </nga-accordion-item>
    </nga-accordion>
  `,
})
class AccordionHost {}

/** Renders the host and returns the fixture with a trigger lookup by its text. */
function mount(): { fixture: ComponentFixture<AccordionHost>; trigger: (text: string) => HTMLButtonElement } {
  TestBed.configureTestingModule({ imports: [AccordionHost] });
  const fixture = TestBed.createComponent(AccordionHost);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement);
  const trigger = (text: string) =>
    [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === text,
    ) as HTMLButtonElement;
  return { fixture, trigger };
}

/** Dispatches a keydown on the focused element, as the browser does. */
function press(init: KeyboardEventInit): void {
  (document.activeElement as HTMLElement).dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }),
  );
}

describe('NgAtomsAccordionTriggerDirective — keyboard', () => {
  it('moves between triggers with Arrow Down and Arrow Up, skipping a disabled one and a nested accordion', () => {
    const { trigger } = mount();
    trigger('A').focus();

    press({ key: 'ArrowDown' });
    expect(document.activeElement).toBe(trigger('C'));
    press({ key: 'ArrowDown' });
    expect(document.activeElement).toBe(trigger('D'));
    press({ key: 'ArrowUp' });
    expect(document.activeElement).toBe(trigger('C'));
    press({ key: 'ArrowUp' });
    expect(document.activeElement).toBe(trigger('A'));
  });

  it('goes to the first and last trigger with Home and End', () => {
    const { trigger } = mount();
    trigger('C').focus();

    press({ key: 'End' });
    expect(document.activeElement).toBe(trigger('D'));
    press({ key: 'Home' });
    expect(document.activeElement).toBe(trigger('A'));
  });

  it('keeps focus at either end instead of wrapping', () => {
    const { trigger } = mount();
    trigger('A').focus();
    press({ key: 'ArrowUp' });
    expect(document.activeElement).toBe(trigger('A'));

    trigger('D').focus();
    press({ key: 'ArrowDown' });
    expect(document.activeElement).toBe(trigger('D'));
  });

  it('leaves the keys to the page when Ctrl, Alt, Meta or Shift is held', () => {
    const { trigger } = mount();
    trigger('C').focus();

    for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey'] as const) {
      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true, [modifier]: true });
      trigger('C').dispatchEvent(event);
      expect(document.activeElement, modifier).toBe(trigger('C'));
      expect(event.defaultPrevented, modifier).toBe(false);
    }
  });

  it('keeps Enter and Space toggling the panel', () => {
    const { fixture, trigger } = mount();
    trigger('C').focus();

    press({ key: 'Enter' });
    fixture.detectChanges();
    expect(trigger('C').getAttribute('aria-expanded')).toBe('true');
    press({ key: ' ' });
    fixture.detectChanges();
    expect(trigger('C').getAttribute('aria-expanded')).toBe('false');
  });

  it('moves within a nested accordion without leaving it', () => {
    const { fixture, trigger } = mount();
    trigger('A').click();
    fixture.detectChanges();
    trigger('Inner').focus();

    press({ key: 'End' });
    expect(document.activeElement).toBe(trigger('Inner'));
    press({ key: 'Home' });
    expect(document.activeElement).toBe(trigger('Inner'));
  });
});
