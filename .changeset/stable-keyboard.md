---
"ngatoms": patch
---

fix(primitives): accordion triggers move with Arrow Up / Down, Home and End, and tabs with Home and End, as their docs already described. Keyboard navigation in tabs skips disabled tabs, and a disabled tab never becomes active nor holds the tab stop. When the active tab is disabled at runtime it stays selected, and the tab stop moves to the first enabled tab so the list stays reachable from the keyboard. With Ctrl, Alt, Meta or Shift held these keys, and the tabs' Arrow Left / Right, are left to the page, so Alt+← goes back in the browser again. Dropdown menu items take focus on hover, and while the arrows move on only the focused item stays highlighted, so the pointer and the keyboard share a single highlight
