# ngatoms

## 1.0.0-rc.7

### Minor Changes

- 10441c9: feat(overlay): the overlay service tells an overlay why it is closing — `escape`, `outside` or `scroll` — through the new `NgAtomsOverlayCloseReason` type. A close function that takes no argument keeps working. When it closes an overlay on Escape it cancels the key, so a modal dialog around the overlay stays open; the next Escape reaches the dialog

  feat(select, date-picker): `defaultOpen` opens the panel as soon as the component is created, for a control that appears on demand such as an inline editor. Escape closes the panel and gives focus back to the trigger; a click elsewhere closes it and leaves focus where the click put it

  fix(select, popover, dropdown-menu, date-picker): the panel opens in the browser's top layer with the Popover API, so it works inside an `nga-dialog` and no scroll container or transformed ancestor clips it. The panel stays inside its component in the DOM, so it keeps the theme of its container, and the select panel follows its trigger when the page or a container scrolls. Escape on a closed select is left to whatever contains it, such as a dialog or an inline editor

  Only these four components change. The tooltip and the grid column filter still move their panel to `<body>`, so they stay broken inside an `nga-dialog` until their own fix

  Firefox 119 to 124 has no Popover API. There the four panels open in place, without the top layer: they work inside an `nga-dialog`, but a scroll container or the dialog itself can clip them. Before this change the popover, dropdown menu and date picker were not clipped in those versions, but they went inert inside a dialog; this is the trade-off

  refactor(popover, dropdown-menu): both place their panel with the shared `computeOverlayPosition`; the result is the same as before for every placement, alignment and flip

## 1.0.0-rc.6

### Minor Changes

- b9fccf6: feat(tokens): the default palette moves from the neutral black-and-white palette of 1.0.0-rc.0 (`monochrome-palette`) to the ember palette: stone neutrals with a cream page (#F3EEE3) and ink (#111111) in light, charcoal and sand in dark, and a burnt orange accent (#D9541E). This replaces the brighter #F06B00 accent of 0.2.0-rc.0 (`ember-design-system`). Status colours have a hue again — success, golden warning, crimson destructive and blue info — each with a `-soft` tint (`--nga-color-success-soft`, `--nga-color-warning-soft`, `--nga-color-destructive-soft`, `--nga-color-info-soft`). Every token name of rc.5 is still defined; 17 names are new in `:root` and 4 in `.dark` (the dark values of the four `-soft` tints)

  feat(primitives): alert, badge and progress read the status tokens instead of fixed greys. Badge gains the `info` variant and progress the `warning` and `info` variants

  style(progress): a flat fill on a quiet track, slimmer heights, and an indeterminate bar that slides across the track; with reduced motion it pulses in place

  fix(primitives): the CSS fallbacks of the components follow the new palette

  fix(primitives): the keyboard focus ring is solid: a 2px gap in the page colour and a 2px ring in `--nga-color-ring`, through the new `--nga-focus-ring` token, so it keeps at least 3:1 against the page in light and dark. Invalid fields use the same ring in the destructive colour. Checkbox and switch drop the browser outline that showed on top of it

  fix(select): the text of the selected option uses `--nga-color-accent-active`, a deeper accent in light and a lighter one in dark, so it keeps at least 4.5:1 on its tinted row

  fix(grid): the header filter button shows at full opacity on keyboard focus, so its focus ring is not faded

## 1.0.0-rc.5

### Patch Changes

- 62e7412: fix(primitives): accordion triggers move with Arrow Up / Down, Home and End, and tabs with Home and End, as their docs already described. Keyboard navigation in tabs skips disabled tabs, and a disabled tab never becomes active nor holds the tab stop. When the active tab is disabled at runtime it stays selected, and the tab stop moves to the first enabled tab so the list stays reachable from the keyboard. With Ctrl, Alt, Meta or Shift held these keys, and the tabs' Arrow Left / Right, are left to the page, so Alt+← goes back in the browser again. Dropdown menu items take focus on hover, and while the arrows move on only the focused item stays highlighted, so the pointer and the keyboard share a single highlight

## 1.0.0-rc.4

### Patch Changes

- 6a37984: fix(registry): `ngatoms add` installs the shared `overlay` with popover, dropdown-menu and date-picker, which import it. A new test checks that every component declares exactly the registry components its code imports

## 1.0.0-rc.3

### Patch Changes

- f1f247a: docs(primitives): every primitive now carries a file header and JSDoc on each function, method and class. ESLint enforces it with `eslint-plugin-jsdoc`, and line comments are no longer allowed in the primitives. No behaviour changes

## 1.0.0-rc.2

### Minor Changes

- 2f3630a: feat(primitives): add `grid` and `grid-core`, a data grid for tree rows, column groups, pinned columns, filters, sorting, editing, range selection and virtualization. Shift+Space selects the active row and Ctrl+Space selects the active column; on macOS the column shortcut stays Ctrl+Space, because ⌘Space belongs to the system. `ngatoms add grid` installs both, plus the shared `overlay`

  feat(overlay): export `computeOverlayPosition` for floating panels. `fillDownChanges` and `fillFromChanges` are public and marked alpha in their JSDoc and in the docs props table

  feat(cli): install `registryDependencies` with a component. An existing dependency folder is not overwritten; if it is missing a file, `ngatoms add` warns, for example `overlay already exists; grid needs overlay/position.ts`

  fix(registry): `ngatoms add select` also copies `select.component.html` and `select.component.css`, and the description no longer calls it a native select

## 1.0.0-rc.1

### Patch Changes

- 9f68770: Mark the shipped components as stable in the registry now that the 1.0 line is published.

## 1.0.0-rc.0

### Major Changes

- Release 1.0.0. The rc channel moves off the 0.x line.

### Minor Changes

- 19c6fd6: chore: require Angular 22+ (peerDependencies bumped from >=21)

## 0.3.0-rc.1

### Minor Changes

- 1192e4d: feat(primitives): overlays (date-picker, dropdown-menu, popover, select, tooltip) now reposition on scroll instead of closing. Overlay service gains a `closeOnScroll` option; panel `z-index` normalized to 50.

## 0.3.0-rc.0

### Minor Changes

- efbcede: Add popover primitive
- 0ed976c: feat(primitives): add date-picker directive with 3 variants, 5 sizes, invalid state, and webkit normalizations
- b349eb5: feat(primitives): add dropdown-menu component with keyboard navigation and item variants
- a4c399d: feat(cli): add status field to registry entries and warn when adding alpha components

### Patch Changes

- 80b55fe: feat(cli): allow shorthand `npx ngatoms <component>` as alias for `npx ngatoms add <component>`
- d10c9b7: feat(cli): add colored status badge to component status warning — amber background for alpha, green for stable
- e7699f8: feat(cli): check for newer version on startup and warn user with upgrade hint
- 80b55fe: fix(cli): align getRef() tag format with changesets convention (ngatoms@x.y.z) and push tags after publish
- 914ffe6: fix(date-picker): remove unused MONTHS constant to resolve lint errors; update README and docs component table — promote date-picker, dropdown-menu, and popover to alpha, remove tier column, sort alphabetically
- c1b5aa5: `init` now fetches `tokens.css` from GitHub instead of writing a hardcoded theme template, so the generated theme always reflects the current brand palette.
- 2595ad8: Add full component status table with descriptions and tier groupings to README
- 689120f: Add component status table to README showing available and coming-soon components

## 0.2.0

### Minor Changes

- Add 8 new components: Input, Switch, Select (custom dropdown with search + multiple selection), Tabs, Accordion, Dialog, Tooltip, and Get Started docs page.

  Update design tokens: cool blue-gray neutral palette (Acorn-inspired), new `info` and `warning` semantic colors, teal success, vivid destructive red, 3-level shadow scale, and improved system font stack.

  Add ESLint configuration with Angular ESLint rules across all workspaces.

### Patch Changes

- 30dfec9: `init` now fetches `tokens.css` from GitHub instead of writing a hardcoded theme template, so the generated theme always reflects the current brand palette.

## 0.1.0

### Minor Changes

- 85478b8: Add CLI: `npx ngatoms init` and `npx ngatoms add <component>`

### Patch Changes

- 8f79907: config packages
