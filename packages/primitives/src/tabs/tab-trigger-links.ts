/**
 * @file Internal links between a registered tab trigger and its element.
 * Not exported from the tabs entry point: the tabs read them to skip
 * disabled triggers, and a trigger reads them to reach its siblings.
 * @internal
 */

import type { NgAtomsTabTriggerDirectiveRef } from './tabs.component';

/** @internal The element of each registered trigger. */
export const TAB_TRIGGER_ELEMENTS = new WeakMap<NgAtomsTabTriggerDirectiveRef, HTMLElement>();

/** @internal The registration reference of each trigger element. */
export const TAB_TRIGGER_REFS = new WeakMap<HTMLElement, NgAtomsTabTriggerDirectiveRef>();
