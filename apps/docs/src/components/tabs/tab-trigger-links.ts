/**
 * @file Internal links between a registered tab trigger and its element.
 * Not exported from the tabs entry point: the tabs read them to skip
 * disabled triggers, and a trigger reads them to reach its siblings.
 * @internal
 */

import { WritableSignal, signal } from '@angular/core';
import type { NgAtomsTabTriggerDirectiveRef } from './tabs.component';

/** @internal The element of each registered trigger. */
export const TAB_TRIGGER_ELEMENTS = new WeakMap<NgAtomsTabTriggerDirectiveRef, HTMLElement>();

/** @internal The registration reference of each trigger element. */
export const TAB_TRIGGER_REFS = new WeakMap<HTMLElement, NgAtomsTabTriggerDirectiveRef>();

const TRIGGER_CHANGES = new WeakMap<object, WritableSignal<number>>();

/**
 * @internal A counter per tabs, bumped when one of its triggers is added,
 * removed, disabled or enabled, so every trigger works out the tab stop again.
 */
export function triggerChanges(tabs: object): WritableSignal<number> {
  let changes = TRIGGER_CHANGES.get(tabs);
  if (!changes) {
    changes = signal(0);
    TRIGGER_CHANGES.set(tabs, changes);
  }
  return changes;
}
