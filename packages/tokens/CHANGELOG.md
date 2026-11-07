# @thereisnoplacelike/ngatoms-tokens

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
