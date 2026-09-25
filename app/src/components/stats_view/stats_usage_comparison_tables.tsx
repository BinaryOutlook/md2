import { Paper, Stack, Typography } from '@mui/material';
import type { StatsChartRow } from '../../services/stats/project_stats_types';
import { StatsTable } from './stats_table';
import { USAGE_COMPARISON_SECTIONS } from './stats_usage_comparison_sections';

interface StatsUsageComparisonTablesProps {
    rows: StatsChartRow[];
    shortTokenCounts?: boolean;
}

/** Small-screen usage comparison: one titled table per comparison chart, in chart order. */
export function StatsUsageComparisonTables({ rows, shortTokenCounts = false }: StatsUsageComparisonTablesProps) {
    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            {USAGE_COMPARISON_SECTIONS.map(({ label, mode, role }) => (
                <Paper key={role} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography component="h3" sx={{ px: 2, pt: 1.5 }} variant="subtitle2">{label}</Typography>
                    <StatsTable ariaLabel={`${label} table`} mode={mode} rows={rows.filter(({ chartRole }) => chartRole === role)} shortTokenCounts={shortTokenCounts} />
                </Paper>
            ))}
        </Stack>
    );
}
