/**
 * @file Specs for the reason the overlay service gives when it closes an overlay.
 */

import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { NgAtomsOverlayCloseReason, NgAtomsOverlayService } from './overlay.service';

/** A registered overlay: its panel, the reasons it was closed with, and how to unregister it. */
interface Registered {
  panel: HTMLElement;
  reasons: NgAtomsOverlayCloseReason[];
  deregister: () => void;
}

const panels: HTMLElement[] = [];

/** Registers a panel in the document and records every close. */
function register(service: NgAtomsOverlayService, closeOnScroll = true): Registered {
  const panel = document.createElement('div');
  document.body.appendChild(panel);
  panels.push(panel);
  const reasons: NgAtomsOverlayCloseReason[] = [];
  const deregister = service.register(reason => reasons.push(reason), panel, { closeOnScroll });
  return { panel, reasons, deregister };
}

/** Lets the service attach its click listener, which it defers by a tick. */
const nextTick = () => new Promise(resolve => setTimeout(resolve));

describe('NgAtomsOverlayService — close reason', () => {
  afterEach(() => {
    panels.splice(0).forEach(panel => panel.remove());
  });

  it('closes the overlay opened last with "escape"', () => {
    const service = TestBed.inject(NgAtomsOverlayService);
    const first = register(service);
    const last = register(service);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(last.reasons).toEqual(['escape']);
    expect(first.reasons).toEqual([]);
    first.deregister();
  });

  it('closes with "outside" on a click outside, and not on a click inside', async () => {
    const service = TestBed.inject(NgAtomsOverlayService);
    const overlay = register(service);
    await nextTick();

    overlay.panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.reasons).toEqual([]);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.reasons).toEqual(['outside']);
  });

  it('closes with "scroll" only the overlays that asked for it', () => {
    const service = TestBed.inject(NgAtomsOverlayService);
    const closes = register(service, true);
    const stays = register(service, false);

    window.dispatchEvent(new Event('scroll'));

    expect(closes.reasons).toEqual(['scroll']);
    expect(stays.reasons).toEqual([]);
    stays.deregister();
  });

  it('cancels the Escape it uses, and leaves alone an Escape already handled', () => {
    const service = TestBed.inject(NgAtomsOverlayService);
    const overlay = register(service);

    const handled = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    handled.preventDefault();
    window.dispatchEvent(handled);
    expect(overlay.reasons).toEqual([]);

    const fresh = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(fresh);
    expect(overlay.reasons).toEqual(['escape']);
    expect(fresh.defaultPrevented).toBe(true);
  });

  it('still accepts a close function that ignores the reason', () => {
    const service = TestBed.inject(NgAtomsOverlayService);
    let closed = 0;
    const panel = document.createElement('div');
    document.body.appendChild(panel);
    panels.push(panel);
    service.register(() => closed++, panel);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(1);
  });
});
