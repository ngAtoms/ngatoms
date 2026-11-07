# @thereisnoplacelike/ngatoms-primitives

## 1.0.0-rc.0

### Major Changes

- Move the remaining workspace packages onto 1.0.0-rc.0. They stay private: primitives are copied into projects, the old CLI package is superseded by ngatoms, utils has no public API yet, and docs is the website.

## 0.2.0-rc.2

### Minor Changes

- 19c6fd6: chore: require Angular 22+ (peerDependencies bumped from >=21)
- 3b480e9: Shift the design system to a neutral black-and-white palette. Ink stays near-black. Light surfaces are a cooler, whiter frost glass, and accent, status, and focus colors no longer use hue. Dark mode keeps text, switch thumbs, scrims, and elevation shadows readable against the near-black page.

### Patch Changes

- 3b480e9: Give dialog descriptions more room before the body and the footer, so confirm modals and dialog content do not sit against the footer.

## 0.2.0-rc.1

### Minor Changes

- 12abee5: Update design system: stone neutrals + ember accent

  Replace warm-gray OKLCH palette with warm-stone hex scale and gold accent with Ember (#F06B00). Component changes: focus rings changed from outline to box-shadow glow-ember, button press changed from scale to translateY(1px), transitions now reference motion tokens, shadows use shadow tokens, alert/progress colors updated to semantic hex, badge gains warning variant, tabs active underline uses ember accent, switch thumb uses ease-spring. Radius values align with DS spec (6px default, 10px for cards).

## 0.2.0-rc.0

### Minor Changes

- efbcede: Add popover primitive

### Patch Changes

- 914ffe6: fix(date-picker): remove unused MONTHS constant to resolve lint errors; update README and docs component table — promote date-picker, dropdown-menu, and popover to alpha, remove tier column, sort alphabetically

## 0.1.0

### Minor Changes

- Add 8 new components: Input, Switch, Select (custom dropdown with search + multiple selection), Tabs, Accordion, Dialog, Tooltip, and Get Started docs page.

  Update design tokens: cool blue-gray neutral palette (Acorn-inspired), new `info` and `warning` semantic colors, teal success, vivid destructive red, 3-level shadow scale, and improved system font stack.

  Add ESLint configuration with Angular ESLint rules across all workspaces.

## 0.0.2

### Patch Changes

- 8f79907: config packages
- 6746ba2: add button as first primitive for testing
