---
"ngatoms": minor
---

feat(primitives): add `grid` and `grid-core`, a data grid for tree rows, column groups, pinned columns, filters, sorting, editing, range selection and virtualization. Shift+Space selects the active row and Ctrl+Space selects the active column; on macOS the column shortcut stays Ctrl+Space, because ⌘Space belongs to the system. `ngatoms add grid` installs both, plus the shared `overlay`

feat(overlay): export `computeOverlayPosition` for floating panels. `fillDownChanges` and `fillFromChanges` are public and marked alpha in their JSDoc and in the docs props table

feat(cli): install `registryDependencies` with a component. An existing dependency folder is not overwritten; if it is missing a file, `ngatoms add` warns, for example `overlay already exists; grid needs overlay/position.ts`

fix(registry): `ngatoms add select` also copies `select.component.html` and `select.component.css`, and the description no longer calls it a native select
