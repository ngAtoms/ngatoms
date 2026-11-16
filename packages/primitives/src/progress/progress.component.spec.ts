/**
 * @file Specs for the progress variants, including warning and info from the ember palette.
 */

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgAtomsProgressComponent, NgAtomsProgressVariant } from './progress.component';

@Component({
  standalone: true,
  imports: [NgAtomsProgressComponent],
  template: `<nga-progress [variant]="variant()" [value]="40" />`,
})
class ProgressHost {
  readonly variant = signal<NgAtomsProgressVariant>('warning');
}

describe('NgAtomsProgressComponent — variants', () => {
  it('applies the warning and info classes and drops the previous one', async () => {
    TestBed.configureTestingModule({ imports: [ProgressHost] });
    const fixture = TestBed.createComponent(ProgressHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const progress = fixture.nativeElement.querySelector('nga-progress') as HTMLElement;
    expect(progress.classList.contains('nga-progress--warning')).toBe(true);

    fixture.componentInstance.variant.set('info');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(progress.classList.contains('nga-progress--info')).toBe(true);
    expect(progress.classList.contains('nga-progress--warning')).toBe(false);
  });
});
