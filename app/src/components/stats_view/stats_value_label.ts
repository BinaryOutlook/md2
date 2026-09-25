import type {
    StatsActivityMetric,
    StatsControls,
    StatsDataset,
    StatsPerformanceMetric,
    StatsTotalsMetric,
} from '../../services/stats/project_stats_types';

const ACTIVITY_METRIC_LABELS: Record<StatsActivityMetric, string> = {
    actions: 'Completed actions',
    cards: 'Distinct cards',
    tokens: 'Token usage',
};

const PERFORMANCE_METRIC_LABELS: Record<StatsPerformanceMetric, string> = {
    duration: 'Measured duration',
    tokens: 'Tokens',
    toolCalls: 'Tool calls',
};

const TOTALS_METRIC_LABELS: Record<StatsTotalsMetric, string> = {
    cost: 'Estimated cost',
    duration: 'Measured duration',
    tokens: 'Token usage',
};

/** Value column heading: the selected metric of a single-chart dataset, named as in the stats menu. */
export function statsValueLabel(dataset: Exclude<StatsDataset, 'usageComparison'>, controls: StatsControls) {
    if (dataset === 'agentPerformance') return PERFORMANCE_METRIC_LABELS[controls.performanceMetric];
    if (dataset === 'totals') return TOTALS_METRIC_LABELS[controls.totalsMetric];

    return ACTIVITY_METRIC_LABELS[controls.activityMetric];
}
