---
author: 
id: F_385
internalId: fa8f32ca-cdc1-4ea8-a31d-b0056ada30a0
title: Action buttons in scrollbox
status: ready
owner: 
affects:
agents:
  - design/releases/0_7_0/card__fa8f32ca-cdc1-4ea8-a31d-b0056ada30a0.json
policy:
---
On the action popup, we no show the action buttons with a wrap.

We should remove the wrap and replace with the new scrollbox we recently added for the markdown toolbar (with left / right scroll buttons  and scrollwheel)

## Current state

`ActionPopupFrame` renders `ActionSelector` in the fixed popup header, below the toolbar. `ActionSelector` renders the action buttons as a `ToggleButtonGroup` (aria-label `Actions`), one `ActionSelectorButton` per action. The group uses the shared `ACTION_SELECTOR_GROUP_SX` (`action_selector_styles.ts`), which sets `flexWrap: 'wrap'`; the outer `Box` in `ActionSelector` also sets `flexWrap: 'wrap'`. When the buttons exceed the popup width, they wrap onto extra rows, which makes the header taller.

`HorizontalScrollArea` (`app/src/components/horizontal_scroll_area.tsx`) is the scrollbox used by the markdown editor toolbar and the app menu `Tab`. It keeps its content on one row, hides the native scrollbar, shows a `Scroll left` / `Scroll right` button with a `background.paper` fade only when content overflows in that direction, maps vertical wheel movement to horizontal scrolling, and scrolls a focused child into view.

`CardSequenceActionSelector` also uses `ACTION_SELECTOR_GROUP_SX`. It is not part of the action popup.

## implementation details

* In `ActionSelector`, replace the outer wrapping `Box` with `HorizontalScrollArea` and render the `ToggleButtonGroup` inside it.
* Keep the action buttons on one row: override `flexWrap` to `nowrap` on the group in `ActionSelector` only, and keep each button at its natural width (no shrinking or label wrapping).
* Scroll the selected action button into view when the popup opens and whenever `selectedAction.id` changes. In `ActionSelector`, use an effect keyed on `selectedAction.id` that finds the selected button (`aria-pressed="true"`) inside the group and calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })`. `block: 'nearest'` prevents vertical scrolling of the popup or page. `HorizontalScrollArea` already sets `scrollPaddingInline` to the scroll button width, so the selected button does not end up under a scroll button.
* Do not change `ACTION_SELECTOR_GROUP_SX`; `CardSequenceActionSelector` keeps its current wrapping behavior.
* Keep button selection, live and persisted state indicators, tooltips, and the `Actions` group label unchanged.
* The scroll buttons are interactive elements inside the header drag handle, so clicking them scrolls the actions and does not start a popup drag. The fade color already matches the header background (`background.paper`).
* Tests: in `action_selector.test.tsx`, add a test that stubs overflow measurements (same pattern as `horizontal_scroll_area.test.tsx`) and verifies the action buttons are rendered inside a scroll area that shows `Scroll right`. Add a test that stubs `scrollIntoView` (jsdom does not implement it) and verifies that it is called on the selected button on first render and again after `selectedAction` changes. Run `action_selector.test.tsx` and `action_popup.test.tsx`.

## acceptance criteria

* Action buttons in the action popup stay on one row at every popup width; the header height does not grow with the number of actions.
* When the buttons overflow, a `Scroll right` and/or `Scroll left` button appears on the side that has hidden buttons; clicking it scrolls the row.
* The mouse wheel over the action row scrolls it horizontally when it overflows.
* Tabbing to a hidden action button scrolls it into view.
* When the popup opens, the selected action is fully visible, even if it sits beyond the visible part of the row. When the selected action changes, the new selection is scrolled into view. The popup does not scroll vertically when this happens.
* When all buttons fit, no scroll buttons are shown.
* Clicking a scroll button does not select an action and does not drag the popup.
* Action selection, state indicators, and tooltips behave as before.
* The sequence action selector is unchanged.