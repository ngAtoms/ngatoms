---
"ngatoms": minor
---

feat(primitives): add 15 components in alpha — skeleton, breadcrumb, timeline, rating, pagination, stepper, slider, tag-input, file-upload, drawer, context-menu, combobox, color-picker, tree, and code-block

feat(cli): install `registryDependencies` along with a component. Fixes `ngatoms add` for popover, dropdown-menu, select, and date-picker, which import the shared `overlay` service that was never copied

refactor(primitives): move popover and dropdown-menu positioning into a shared `overlay/position` helper

feat(tokens): new default palette — cream (#F3EEE3) and ink (#111111) in light, charcoal (#1E1E1C) and sand (#D8CBB3) in dark, with a burnt orange accent (#D9541E) and a warm neutral scale. Status tokens have a hue again — success, golden warning, crimson destructive, and electric blue info (#2F6BFF) — with a `-soft` tint for each. Alert, badge, and progress read these tokens instead of hard-coded grays; badge and progress gain `info`, and progress gains `warning`

style(progress): flat fill on a quiet track, slimmer heights, and a sliding indeterminate bar

fix(drawer, context-menu): open without highlighting the first control, and animate both opening and closing. Menu items now take focus on hover, so hover and keyboard share a single highlight
