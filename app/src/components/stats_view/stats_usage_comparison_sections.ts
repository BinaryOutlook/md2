import type { StatsChartRole } from '../../services/stats/project_stats_types';

export interface UsageComparisonSection {
    label: string;
    mode: 'grouped' | 'groupedStacked';
    role: StatsChartRole;
}

/** Usage comparison sections in display order; shared by the chart and table renderings. */
export const USAGE_COMPARISON_SECTIONS: UsageComparisonSection[] = [
    { label: 'Account usage', mode: 'grouped', role: 'accountUsage' },
    { label: 'Project token usage (totals)', mode: 'grouped', role: 'projectTokensTotal' },
    { label: 'Project token usage (average per action)', mode: 'grouped', role: 'projectTokensAverage' },
    { label: 'Tokens per percent account usage', mode: 'grouped', role: 'tokensPerAccountUsage' },
    { label: 'Tokens per dollar', mode: 'grouped', role: 'tokensPerDollar' },
    { label: 'Estimated cost per agent', mode: 'grouped', role: 'costPerAgent' },
    { label: 'Average cost per action', mode: 'grouped', role: 'costPerActionAverage' },
    { label: 'Actions per percent account usage', mode: 'grouped', role: 'actionsPerAccountUsage' },
    { label: 'Project activity', mode: 'groupedStacked', role: 'activity' },
];
