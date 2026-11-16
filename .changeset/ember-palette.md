---
"@ngatoms/ngatoms-tokens": minor
"ngatoms": minor
---

feat(tokens): the default palette moves from the neutral black-and-white palette of 1.0.0-rc.0 (`monochrome-palette`) to the ember palette: stone neutrals with a cream page (#F3EEE3) and ink (#111111) in light, charcoal and sand in dark, and a burnt orange accent (#D9541E). This replaces the brighter #F06B00 accent of 0.2.0-rc.0 (`ember-design-system`). Status colours have a hue again — success, golden warning, crimson destructive and blue info — each with a `-soft` tint (`--nga-color-success-soft`, `--nga-color-warning-soft`, `--nga-color-destructive-soft`, `--nga-color-info-soft`). Every token name of rc.5 is still defined; 16 names are new

feat(primitives): alert, badge and progress read the status tokens instead of fixed greys. Badge gains the `info` variant and progress the `warning` and `info` variants

style(progress): a flat fill on a quiet track, slimmer heights, and an indeterminate bar that slides across the track; with reduced motion it pulses in place

fix(primitives): the CSS fallbacks of the components follow the new palette

fix(primitives): the keyboard focus ring is solid: a 2px gap in the page colour and a 2px ring in `--nga-color-ring`, through the new `--nga-focus-ring` token, so it keeps at least 3:1 against the page in light and dark. Invalid fields use the same ring in the destructive colour. Checkbox and switch drop the browser outline that showed on top of it

fix(select): the text of the selected option uses `--nga-color-accent-active`, a deeper accent in light and a lighter one in dark, so it keeps at least 4.5:1 on its tinted row

fix(grid): the header filter button shows at full opacity on keyboard focus, so its focus ring is not faded
