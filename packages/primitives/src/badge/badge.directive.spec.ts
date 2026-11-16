/**
 * @file Specs for the badge variants, including the info variant of the ember palette.
 */

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgAtomsBadgeDirective, NgAtomsBadgeVariant } from './badge.directive';

@Component({
  standalone: true,
  imports: [NgAtomsBadgeDirective],
  template: `<span ngAtomsBadge [variant]="variant()">Label</span>`,
})
class BadgeHost {
  readonly variant = signal<NgAtomsBadgeVariant>('info');
}

describe('NgAtomsBadgeDirective — variants', () => {
  it('applies the class of each variant, info included, and drops the previous one', async () => {
    TestBed.configureTestingModule({ imports: [BadgeHost] });
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const badge = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(badge.classList.contains('nga-badge--info')).toBe(true);

    fixture.componentInstance.variant.set('warning');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(badge.classList.contains('nga-badge--warning')).toBe(true);
    expect(badge.classList.contains('nga-badge--info')).toBe(false);
  });
});
