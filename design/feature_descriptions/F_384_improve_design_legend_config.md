---
author: 
id: F_384
internalId: ef0c0e83-0726-460e-8331-55e6ef3e2ab9
title: Improve design legend config
status: ready for implementation
owner: 
affects:
agents:
  - design/activity/card__ef0c0e83-0726-460e-8331-55e6ef3e2ab9.json
policy:
after: c0629e16-a603-4a9c-b19d-5c7cac9772ec
branch: f_384_improve_design_legend_config
worktree: 2
---
See F\_376 where we impoved the design of the markdown config popup. We grouped, used proper controls...

We need to do the same for the config popup used by the legend items on the diagrams

## Current state

* **Entry point.** `DiagramLegendEntryRow` (`app/src/components/diagram_view/legend/diagram_legend_entry_row.tsx`) shows a `Format <label>` icon button on hover or focus. It is used on both the Current tab and the New tab. Node rows open `NodeFormattingPopover` (`formatting/diagram_formatting_popover.tsx`); connection rows open `ConnectionFormattingPopover` (`formatting/diagram_connection_formatting_popover.tsx`). These two popovers have no other callers.
* **Commit model.** Each popover keeps a local draft in `useState`. `Apply` submits the form and calls `onApply` once, which runs `store.setNodeRoleFormatting` or `store.setConnectionKindFormatting`. When `onApply` throws, the popover reports the error through `dialogService` and stays open. `Cancel` or closing discards the draft.
* **Layout.** Popover width is 380 px. The body is one flat column that scrolls, with `overline` sub-headings (`Font` / `Box` for nodes, `Label font` / `Connection` for connections). Every field shows its own helper text. The footer bar holds `Cancel` and `Apply`.
* **Controls.**
  * Font family: free-text `TextField`, where empty means the theme font (`optionalString`).
  * Bold, italic, underline: `Checkbox`.
  * Colors (font, fill, border, line): `OptionalColorPickerField` (`app/src/components/optional_color_picker_field.tsx`). The field shows the full inline palette when a custom color is set, or a `Use custom color` button when the default is used. It is tall.
  * Numbers (font size, border thickness, corner radius, line thickness): `OptionalSliderField` (`formatting/optional_slider_field.tsx`). The field stacks a label row, a slider, a `Use custom value` / `Use default` button and helper text. `undefined` means the default is used.
  * Enums (border style, content position, start marker, end marker): select `TextField`s.
* **F_376 reference** (`app/src/components/config/markdown_section_editor.tsx`): fields are grouped in `MarkdownStyleGroup` cards (`Font`, `Size & color`, `Spacing`). It uses a font family select that is built from `MARKDOWN_FONT_FAMILIES`, plus the current value when that value is not one of the presets (`fontFamilyOptions`). It uses `Switch` for bold, italic and underline, and `ColorPickerButton` for color (a compact box that opens the picker and includes a Default box). It shows no helper texts. Paired fields share a row, each taking half the width.
* **Tests:** `diagram_formatting_popover.test.tsx`, `diagram_connection_formatting_popover.test.tsx`, `diagram_optional_formatting_fields.test.tsx` and `legend/diagram_session_legend_entries.test.tsx`. They query `textbox Font family`, `Use default for …`, `Use custom color for …`, `checkbox Bold`, and the helper texts.

## Implementation details

* **Terms.** *Group card*: a small outlined card with a heading that holds related fields (the F_376 `MarkdownStyleGroup`). *Compact slider*: an `OptionalSliderField` that has no button and no helper text. Instead, a `Custom` switch in its label row toggles between the default value and a custom value.
* **Commit model unchanged.** Keep the draft state, `Apply` / `Cancel`, the `dialogService` error path, the titles (`Format <label> nodes` / `Format <label> connections`) and the stored formatting shape.
* **Shared group card.** Move `markdown_style_group.tsx` to `app/src/components/formatting_group.tsx` and rename it `FormattingGroup`. Behavior stays the same. Update the import in `markdown_section_editor.tsx`. Both the markdown popover and the diagram popovers use this component.
* **Font family select.**
  * Move `fontFamilyOptions` from `markdown_section_editor.tsx` to `app/src/theme/theme_config.ts`, next to `MARKDOWN_FONT_FAMILIES`, and export it.
  * Add `DiagramFontFamilySelect` (`formatting/diagram_font_family_select.tsx`) with props `value` and `onChange`. It renders a select `TextField` labelled `Font family`, with `autoFocus`. Its first option is `Theme default` (value `''`), followed by `fontFamilyOptions(value)`, or `MARKDOWN_FONT_FAMILIES` when `value` is `''`. Each option is rendered in its own font, as in the markdown editor.
  * A saved family that is not a preset (for example `Inter`) appears as its own extra option. `optionalString` still turns `''` into `undefined` when Apply runs.
* **Compact slider.** Change `OptionalSliderField` as follows. Its only callers are the two popovers and its test.
  * Drop the `helperText` prop, the button and the helper line.
  * The label row becomes: label caption, value text (`Default` or `<n> <unit>`), then a `Switch` with `aria-label="Custom <label>"`.
  * Turning the switch on calls `onChange(customValue)`. Turning it off calls `onChange(undefined)`. The slider stays disabled while the default is used.
* **Colors.** Replace `OptionalColorPickerField` with `ColorPickerButton` (`value` `undefined` = Default). `OptionalColorPickerField` then has no callers left: delete the file and its `describe` block in `diagram_optional_formatting_fields.test.tsx`.
* **Switches.** Replace the `Checkbox`es for Bold, Italic and Underline with `Switch`es in a wrapping row, as in the markdown editor.
* **Helper texts.** Remove every field helper text, matching F_376.
* **Node groups** (in this order):
  * `Font`: font family select, then the Bold / Italic / Underline switches.
  * `Size & color`: font size compact slider, then font color button.
  * `Box`: fill color and border color buttons on one row (half width each), then content position select.
  * `Border`: border style select, then border thickness and corner radius compact sliders.
* **Connection groups** (in this order):
  * `Label font`: font family select, then switches.
  * `Label size & color`: font size compact slider, then font color button.
  * `Line`: line color button, then line thickness compact slider.
  * `Markers`: start marker and end marker selects on one row (half width each).
* **Layout.** Title (`subtitle2`), then the group cards in a `Stack` with `spacing={1}` inside the scrolling body (`maxHeight: '70vh'`). The footer is unchanged. Group ids follow the pattern `diagram-<node|connection>-<group>`, for example `diagram-node-box`.
* **Edge cases.**
  * The color button opens a nested popover. Closing that nested popover with Escape or click-away must not close the formatting popover. This is the existing MUI popover stacking behavior; verify it manually.
  * A saved slider value outside the slider bounds cannot occur, because validation enforces the ranges. No extra handling is needed.
  * An unknown saved font family stays selectable. Choosing `Theme default` clears it when Apply runs.
* **Docs.** `class_relationships.md` does not list these classes, so no architecture update is needed.
* **Tests.**
  * The two popover tests:
    * Query `combobox Font family` and select an option instead of typing.
    * Assert colors by opening the color button and reading the picker's value.
    * Reset overrides through `Use default colour` in the color popover and the `Custom <label>` switch.
    * Replace the helper-text assertions with assertions that the group headings are present (`region` roles).
    * In the failure test, change the family by selecting `Serif`.
  * `diagram_optional_formatting_fields.test.tsx`: drive `OptionalSliderField` through the `Custom Font size` switch. Remove the `OptionalColorPickerField` block.
  * `diagram_session_legend_entries.test.tsx`: use the font family select, set the fill color through the `Fill color` button, and use `switch Bold`.
  * `theme_config.node.test.ts`: add a test that `fontFamilyOptions` appends an unknown family and does not change the preset list.

## Acceptance criteria

* Opening `Format <label>` on a node legend row shows the `Font`, `Size & color`, `Box` and `Border` groups. On a connection row it shows the `Label font`, `Label size & color`, `Line` and `Markers` groups.
* Font family is a select with `Theme default` plus the markdown font presets. A saved family that is not a preset appears as an extra option.
* Bold, italic and underline are switches.
* Colors use the compact color button. Its Default box resets the color to the theme or role default.
* Number fields show a compact slider with a `Custom` switch. With the switch off, the value shows `Default` and the slider is disabled.
* No field helper texts are shown.
* `Apply` writes one formatting update. `Cancel`, Escape or click-away discards the draft. An Apply error is reported through `dialogService` and keeps the popover open.
* The markdown style popover looks and behaves the same after the move to `FormattingGroup`.
* Both Current and New legend tabs use the new layout.
* Updated tests pass.