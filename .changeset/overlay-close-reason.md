---
"ngatoms": minor
---

feat(overlay): the overlay service tells an overlay why it is closing — `escape`, `outside` or `scroll` — through the new `NgAtomsOverlayCloseReason` type. A close function that takes no argument keeps working. When it closes an overlay on Escape it cancels the key, so a modal dialog around the overlay stays open; the next Escape reaches the dialog

feat(select, date-picker): `defaultOpen` opens the panel as soon as the component is created, for a control that appears on demand such as an inline editor. Escape closes the panel and gives focus back to the trigger; a click elsewhere closes it and leaves focus where the click put it

fix(select, popover, dropdown-menu, date-picker): the panel opens in the browser's top layer with the Popover API, so it works inside an `nga-dialog` and no scroll container or transformed ancestor clips it. The panel stays inside its component in the DOM, so it keeps the theme of its container, and the select panel follows its trigger when the page or a container scrolls. Escape on a closed select is left to whatever contains it, such as a dialog or an inline editor

Only these four components change. The tooltip and the grid column filter still move their panel to `<body>`, so they stay broken inside an `nga-dialog` until their own fix

Firefox 119 to 124 has no Popover API. There the four panels open in place, without the top layer: they work inside an `nga-dialog`, but a scroll container or the dialog itself can clip them. Before this change the popover, dropdown menu and date picker were not clipped in those versions, but they went inert inside a dialog; this is the trade-off

refactor(popover, dropdown-menu): both place their panel with the shared `computeOverlayPosition`; the result is the same as before for every placement, alignment and flip
