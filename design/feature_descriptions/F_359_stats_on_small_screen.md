---
author: 
id: F_359
internalId: 6b01f79a-7950-42c5-b09b-4f77086aa427
title: Stats on small screen
status: ready
owner: 
affects:
agents:
  - design/activity/card__6b01f79a-7950-42c5-b09b-4f77086aa427.json
policy:
changedFiles:
  - app/src/components/stats_view/stats_bar_chart.tsx
  - app/src/components/stats_view/stats_bar_groups.ts
  - app/src/components/stats_view/stats_content.tsx
  - app/src/components/stats_view/stats_table.test.tsx
  - app/src/components/stats_view/stats_table.tsx
  - app/src/components/stats_view/stats_usage_comparison_charts.tsx
  - app/src/components/stats_view/stats_usage_comparison_sections.ts
  - app/src/components/stats_view/stats_usage_comparison_tables.tsx
  - app/src/components/stats_view/stats_value_format.node.test.ts
  - app/src/components/stats_view/stats_value_format.ts
after: c8ca7e43-f909-4a9a-8bc4-3c3f1c305219
---

When on small screen, show the stats as tables instead of charts. This is easier to read

## Current state

* `StatsView` shows `StatsContent` in stats view mode, on both desktop and mobile. `MobileMainWindow` hides the navigation drawer content in stats mode, so stats fill the workspace.
* `StatsContent` subscribes to `projectStatsService` and renders `StatsBarChart`, or `StatsUsageComparisonCharts` for the `usageComparison` dataset. Chart mode (`single`, `grouped`, `stacked`, `groupedStacked`) is derived from the controls.
* `StatsBarChart` is a custom flex/absolute-positioned chart. Buckets are fixed at 112px wide, so on a narrow screen most data needs horizontal scrolling. Values are only readable as small captions above the bars or in hover tooltips; stacked segment values are tooltip-only, and hover does not exist on touch screens.
* `StatsUsageComparisonCharts` renders nine charts, one per `chartRole`, each with its own heading.
* Value formatting (`formattedValue`, `stackTotalLabel`) is private to `stats_bar_chart.tsx`.
* Small screen means `useMediaQuery(theme.breakpoints.down('md'))`, the same test used by `ProjectWorkspace`, `MainWindow`, and other mobile layouts.
* The app has no MUI `Table` usage yet.

## Implementation details

* In `StatsContent`, when the screen is small, render a table in place of `StatsBarChart` or `StatsUsageComparisonCharts`. Keep the loading, error, empty, token-unavailable, warning, and exclusion states unchanged. Desktop keeps its charts.
* Add `StatsTable` (`stats_table.tsx`) using MUI `Table` with `size="small"` and a sticky header, and inputs `rows`, `mode`, `shortTokenCounts`, and `ariaLabel`. Columns:
  * `Period / label`: the row's `displayLabel`, which is the time bucket or the totals label.
  * `Series`: `stackLabel` and `seriesLabel` joined by ` – ` when both exist, otherwise whichever exists. Omit this column when no row has either label.
  * `Value`: the formatted value, followed by `± deviation` when `deviation` is not null.
* Keep row order equal to `snapshot.rows` order, grouped by bucket as in `bucketRows`. For `stacked` and `groupedStacked` modes, add one `Total` row per stack after its segments, using the same total the chart labels.
* Move `formattedValue` and `stackTotalLabel` (and the helper `abbreviatesTokens`) into a shared module `stats_value_format.ts`, used by both the chart and the table. The chart keeps its current output.
* For `usageComparison`, add `StatsUsageComparisonTables`, which uses the same chart list (label, mode, and role) as `StatsUsageComparisonCharts`. Move that list to a shared constant so both render the same sections. Each section has an `h3` heading and a `StatsTable` for rows of that role.
* The table sits in the existing scroll viewport (`stats-chart-viewport`). Use theme slots only: header cells `custom.colHead`, borders `divider`, text `text.primary` and `text.secondary`. Right-align values. Series colors are not needed in the table.
* The chart legend and tooltips are not reproduced. Rows with `available: false` show `Unavailable`, matching the chart.
* The CSV export in `StatsMenuTab` stays unchanged.

## Acceptance criteria

* Below the `md` breakpoint, the stats view shows tables instead of bar charts for all datasets. At `md` and above, charts render as before.
* Each table row shows its period or label, series (if any), and formatted value in the same format as the chart: tokens abbreviated when `shortTokenCounts` is on, durations as `HH:MM:SS`, percents, and dollars. Deviation is shown as `± value`.
* Stacked and grouped-stacked datasets show each segment row plus a `Total` row per stack.
* The `usageComparison` dataset shows one titled table per comparison chart, in chart order.
* Loading, error, empty, token-unavailable, warning, and exclusion messages behave the same on small screens.
* Tests cover: table rendered instead of chart on small screen (mocked media query), chart rendered on large screen, value and deviation formatting, `Total` rows for stacked modes, the usage comparison sections, and unchanged chart value labels after moving the formatters.