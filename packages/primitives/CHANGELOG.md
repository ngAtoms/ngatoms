# @thereisnoplacelike/ngatoms-primitives

## 0.2.0

### Minor Changes

- 4938fd9: Add popover primitive
- 518e661: Update design system: stone neutrals + ember accent

  Replace warm-gray OKLCH palette with warm-stone hex scale and gold accent with Ember (#F06B00). Component changes: focus rings changed from outline to box-shadow glow-ember, button press changed from scale to translateY(1px), transitions now reference motion tokens, shadows use shadow tokens, alert/progress colors updated to semantic hex, badge gains warning variant, tabs active underline uses ember accent, switch thumb uses ease-spring. Radius values align with DS spec (6px default, 10px for cards).

### Patch Changes

- 4938fd9: fix(date-picker): remove unused MONTHS constant to resolve lint errors; update README and docs component table — promote date-picker, dropdown-menu, and popover to alpha, remove tier column, sort alphabetically

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
