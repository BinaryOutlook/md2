---
author: 
id: F_388
internalId: 890d7f2c-90e4-4069-b408-1c01db9f7607
title: Stats 2 modes
status: ready for implementation
owner: 
affects:
agents:
  - design/activity/card__890d7f2c-90e4-4069-b408-1c01db9f7607.json
policy:
branch: f_388_stats_2_modes
worktree: 3
---
The stats view currently already supports 2 view modes: tables and charts. Currently selection between the 2 is made based on screen size.

We need to change 2 things:

* Switch between mode should be possible from the stats menu: 2 icon buttons in group
* When on small screen, show bars in charts horizontally, so user can scroll down to see more values(phone format)

## Current state

* `StatsContent` selects tables below the `md` breakpoint and charts at `md` and above. Users cannot override this choice. Both views use the same rows and dataset controls from `projectStatsService`.
* `StatsMenuTab` holds dataset, view, filter, and export controls in the app menu; it has no table/chart switch.
* `StatsBarChart` draws vertical bars in fixed-width time buckets. Narrow screens therefore require sideways scrolling. `StatsUsageComparisonCharts` renders nine sections through the same chart component.

## Implementation details

* Add a two-icon table/chart selector to the `View` group in `StatsMenuTab`. Show the selected mode, with a tooltip and accessible name on each icon. Keep it available for every dataset on both screen sizes.
* Store the user's mode choice in `projectStatsService` as view state. Until the user chooses, use the current size-based default: tables below `md`, charts at `md` and above. After a choice, keep it when the screen size, dataset, or stats view changes. Changing mode must reuse existing rows without recalculating stats or reopening the stats session.
* Make `StatsContent` render `StatsTable`/`StatsUsageComparisonTables` for table mode and `StatsBarChart`/`StatsUsageComparisonCharts` for chart mode. Keep loading, error, empty, warning, exclusion, and unavailable-data states unchanged.
* Below `md`, render chart bars horizontally: place time buckets down the page in current order, with grouped bars or stacked segments extending across the available width. Preserve value labels, series colors, legend, accessible row descriptions, negative-value baseline, deviation markers, and tooltips. Keep the existing vertical chart at `md` and above. Apply the same orientation to all nine usage-comparison charts.
* Keep the chart panel as the scrolling container. On narrow screens, chart content fits its width and more buckets are reached by scrolling down, without sideways scrolling caused by fixed bucket widths.
* Update focused tests for mode selection and persistence, breakpoint defaults, switching each dataset between tables and charts, and horizontal chart behavior for single, grouped, stacked, negative, and deviation values.

## Acceptance criteria

* Stats menu shows two grouped icon buttons named `Tables` and `Charts`; the active button is visibly selected and exposed as pressed to assistive technology.
* Before a manual choice, narrow screens show tables and wider screens show charts. After a choice, that mode remains selected across resizing, dataset changes, and leaving and returning to stats view.
* Either mode works for every dataset, including all nine usage-comparison sections, and uses the current filters and formatting. Switching modes does not reload or recalculate stats.
* On screens below `md`, selected charts use horizontal bars and vertical scrolling. Labels, grouped/stacked values, negative values, deviations, colors, tooltips, and accessible descriptions remain usable. Wider charts keep their current vertical layout.
* Loading, error, empty, warning, exclusion, and unavailable-data messages remain correct in both modes.
