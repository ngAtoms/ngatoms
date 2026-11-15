---
"ngatoms": patch
---

feat(primitives): add `grid`, a data grid for large structured data — tree rows, column groups, pinned and resizable columns, number formatting, header filters, sorting, keyboard navigation, cell editing that emits changes without touching the data, per-cell states, range selection, copy/cut/paste as tab-separated text, fill down, undo/redo, cell and editor templates for the app's own markup and controls, row drag and drop, paging by scroll, children loaded on demand, CSV export, touch and small-screen behaviour — and `grid-core`, the framework-free models behind it. `ngatoms add grid` installs both

fix(primitives): `nga-select` renders its panel in `<body>` with fixed coordinates, so a scroll container or a transformed ancestor no longer clips it; a closed select leaves Escape to its container. `nga-select` and `nga-date-picker` accept `defaultOpen`

fix(primitives): the overlay service passes the reason an overlay is closing (`escape`, `outside`, `scroll`); `nga-date-picker` and `nga-select` return focus to their trigger on Escape
