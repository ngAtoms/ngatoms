# @thereisnoplacelike/ngatoms-tokens

## 1.0.0

### Major Changes

- f9832b7: Release 1.0.0. The rc channel moves off the 0.x line.

  The public API of stable components follows semver. Components marked alpha are outside semver and can change in a minor or patch release; today that is grid (with grid-core), including fillDownChanges and fillFromChanges.

### Minor Changes

- 3aeb00d: Update design system: stone neutrals + ember accent

  Replace warm-gray OKLCH palette with warm-stone hex scale and gold accent with Ember (#F06B00). Component changes: focus rings changed from outline to box-shadow glow-ember, button press changed from scale to translateY(1px), transitions now reference motion tokens, shadows use shadow tokens, alert/progress colors updated to semantic hex, badge gains warning variant, tabs active underline uses ember accent, switch thumb uses ease-spring. Radius values align with DS spec (6px default, 10px for cards).

- b9fccf6: feat(tokens): the default palette moves from the neutral black-and-white palette of 1.0.0-rc.0 (`monochrome-palette`) to the ember palette: stone neutrals with a cream page (#F3EEE3) and ink (#111111) in light, charcoal and sand in dark, and a burnt orange accent (#D9541E). This replaces the brighter #F06B00 accent of 0.2.0-rc.0 (`ember-design-system`). Status colours have a hue again — success, golden warning, crimson destructive and blue info — each with a `-soft` tint (`--nga-color-success-soft`, `--nga-color-warning-soft`, `--nga-color-destructive-soft`, `--nga-color-info-soft`). Every token name of rc.5 is still defined; 17 names are new in `:root` and 4 in `.dark` (the dark values of the four `-soft` tints)

  feat(primitives): alert, badge and progress read the status tokens instead of fixed greys. Badge gains the `info` variant and progress the `warning` and `info` variants

  style(progress): a flat fill on a quiet track, slimmer heights, and an indeterminate bar that slides across the track; with reduced motion it pulses in place

  fix(primitives): the CSS fallbacks of the components follow the new palette

  fix(primitives): the keyboard focus ring is solid: a 2px gap in the page colour and a 2px ring in `--nga-color-ring`, through the new `--nga-focus-ring` token, so it keeps at least 3:1 against the page in light and dark. Invalid fields use the same ring in the destructive colour. Checkbox and switch drop the browser outline that showed on top of it

  fix(select): the text of the selected option uses `--nga-color-accent-active`, a deeper accent in light and a lighter one in dark, so it keeps at least 4.5:1 on its tinted row

  fix(grid): the header filter button shows at full opacity on keyboard focus, so its focus ring is not faded

- 3b480e9: Shift the design system to a neutral black-and-white palette. Ink stays near-black. Light surfaces are a cooler, whiter frost glass, and accent, status, and focus colors no longer use hue. Dark mode keeps text, switch thumbs, scrims, and elevation shadows readable against the near-black page.

### Patch Changes

- 3b480e9: Add an accent active step so a pressed primary button is distinct from hover in light and dark mode.
- e38eab0: Declare the GitHub repository on the tokens package so npm trusted publishing can match the workflow that publishes it.

## 1.0.0-rc.1

### Minor Changes

- b9fccf6: feat(tokens): the default palette moves from the neutral black-and-white palette of 1.0.0-rc.0 (`monochrome-palette`) to the ember palette: stone neutrals with a cream page (#F3EEE3) and ink (#111111) in light, charcoal and sand in dark, and a burnt orange accent (#D9541E). This replaces the brighter #F06B00 accent of 0.2.0-rc.0 (`ember-design-system`). Status colours have a hue again — success, golden warning, crimson destructive and blue info — each with a `-soft` tint (`--nga-color-success-soft`, `--nga-color-warning-soft`, `--nga-color-destructive-soft`, `--nga-color-info-soft`). Every token name of rc.5 is still defined; 17 names are new in `:root` and 4 in `.dark` (the dark values of the four `-soft` tints)

  feat(primitives): alert, badge and progress read the status tokens instead of fixed greys. Badge gains the `info` variant and progress the `warning` and `info` variants

  style(progress): a flat fill on a quiet track, slimmer heights, and an indeterminate bar that slides across the track; with reduced motion it pulses in place

  fix(primitives): the CSS fallbacks of the components follow the new palette

  fix(primitives): the keyboard focus ring is solid: a 2px gap in the page colour and a 2px ring in `--nga-color-ring`, through the new `--nga-focus-ring` token, so it keeps at least 3:1 against the page in light and dark. Invalid fields use the same ring in the destructive colour. Checkbox and switch drop the browser outline that showed on top of it

  fix(select): the text of the selected option uses `--nga-color-accent-active`, a deeper accent in light and a lighter one in dark, so it keeps at least 4.5:1 on its tinted row

  fix(grid): the header filter button shows at full opacity on keyboard focus, so its focus ring is not faded

## 1.0.0-rc.0

### Major Changes

- Release 1.0.0. The rc channel moves off the 0.x line.

### Minor Changes

- 3b480e9: Shift the design system to a neutral black-and-white palette. Ink stays near-black. Light surfaces are a cooler, whiter frost glass, and accent, status, and focus colors no longer use hue. Dark mode keeps text, switch thumbs, scrims, and elevation shadows readable against the near-black page.

### Patch Changes

- 3b480e9: Add an accent active step so a pressed primary button is distinct from hover in light and dark mode.
- e38eab0: Declare the GitHub repository on the tokens package so npm trusted publishing can match the workflow that publishes it.

## 0.2.0-rc.0

### Minor Changes

- 12abee5: Update design system: stone neutrals + ember accent

  Replace warm-gray OKLCH palette with warm-stone hex scale and gold accent with Ember (#F06B00). Component changes: focus rings changed from outline to box-shadow glow-ember, button press changed from scale to translateY(1px), transitions now reference motion tokens, shadows use shadow tokens, alert/progress colors updated to semantic hex, badge gains warning variant, tabs active underline uses ember accent, switch thumb uses ease-spring. Radius values align with DS spec (6px default, 10px for cards).

## 0.0.2

### Patch Changes

- 8f79907: config packages
