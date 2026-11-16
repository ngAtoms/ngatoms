/**
 * @file Specs for dropdown menu items following the pointer.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgAtomsDropdownItemDirective } from './dropdown-item.directive';
import { NgAtomsDropdownMenuComponent } from './dropdown-menu.component';
import { NgAtomsDropdownTriggerDirective } from './dropdown-trigger.directive';

@Component({
  standalone: true,
  imports: [NgAtomsDropdownMenuComponent, NgAtomsDropdownTriggerDirective, NgAtomsDropdownItemDirective],
  template: `
    <nga-dropdown-menu [open]="true">
      <button ngAtomsDropdownTrigger>Menu</button>
      <button ngAtomsDropdownItem>Copy</button>
      <button ngAtomsDropdownItem [disabled]="true">Share</button>
      <button ngAtomsDropdownItem>Paste</button>
      <button ngAtomsDropdownItem>Delete</button>
    </nga-dropdown-menu>
  `,
})
class MenuHost {}

/** Renders the host and returns an item lookup by its text. */
function mount(): { fixture: ComponentFixture<MenuHost>; item: (text: string) => HTMLButtonElement } {
  TestBed.configureTestingModule({ imports: [MenuHost] });
  const fixture = TestBed.createComponent(MenuHost);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement);
  const item = (text: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('.nga-dropdown-item')].find(
      button => button.textContent?.trim() === text,
    ) as HTMLButtonElement;
  return { fixture, item };
}

describe('NgAtomsDropdownItemDirective — pointer', () => {
  it('focuses the item under the pointer, and the arrows continue from there', () => {
    const { item } = mount();
    item('Copy').focus();

    item('Paste').dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.activeElement).toBe(item('Paste'));

    item('Paste').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(item('Delete'));
  });

  it('does not focus a disabled item', () => {
    const { item } = mount();
    item('Copy').focus();

    item('Share').dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.activeElement).toBe(item('Copy'));
  });
});
