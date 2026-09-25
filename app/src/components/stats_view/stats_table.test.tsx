import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { StatsChartRow } from '../../services/stats/project_stats_types';
import { formatDurationHms } from '../../services/stats/stats_tooltip';
import { AppThemeProvider } from '../../theme/theme_provider';
import { formatTokenCount } from '../agents/token_count_format';
import { StatsTable } from './stats_table';
import { StatsUsageComparisonTables } from './stats_usage_comparison_tables';
import { USAGE_COMPARISON_SECTIONS } from './stats_usage_comparison_sections';

function row(overrides: Partial<StatsChartRow> = {}): StatsChartRow {
    return {
        actionId: null,
        actionType: null,
        accessibleLabel: 'accessible',
        aggregation: null,
        agent: null,
        available: true,
        chartRole: 'primary',
        colorGroup: null,
        displayLabel: '18 Aug',
        grouping: 'day',
        identity: 'codex',
        denominator: null,
        deviation: null,
        limitId: null,
        metric: 'tokens',
        numerator: null,
        provider: null,
        sampleCount: null,
        seriesIdentity: null,
        seriesLabel: null,
        stackIdentity: null,
        stackLabel: null,
        statusCounts: null,
        tooltip: '',
        unit: 'tokens',
        utcBucketEnd: '2026-08-19T00:00:00.000Z',
        utcBucketStart: '2026-08-18T00:00:00.000Z',
        value: 5,
        windowId: null,
        ...overrides,
    };
}

function renderTable(component: React.ReactNode) {
    return render(<AppThemeProvider>{component}</AppThemeProvider>);
}

function bodyRowTexts() {
    const [, ...bodyRows] = screen.getAllByRole('row');

    return bodyRows.map((tableRow) => within(tableRow).getAllByRole('cell').map((cell) => cell.textContent));
}

describe('StatsTable', () => {
    afterEach(() => {
        cleanup();
    });

    it('shows period, joined series, and formatted value per row', () => {
        renderTable(<StatsTable rows={[
            row({ seriesLabel: 'Review', stackLabel: 'codex', value: 428913 }),
            row({ identity: 'claude', seriesLabel: 'Claude', value: 12 }),
        ]} shortTokenCounts />);

        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Period / label', 'Series', 'Value']);
        expect(bodyRowTexts()).toEqual([
            ['18 Aug', 'codex – Review', formatTokenCount(428913)],
            ['18 Aug', 'Claude', formatTokenCount(12)],
        ]);
    });

    it('omits the series column when no row has a series or stack label', () => {
        renderTable(<StatsTable ariaLabel="Totals table" rows={[row({ displayLabel: 'F_1' })]} />);

        expect(screen.getByRole('table', { name: 'Totals table' })).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Period / label', 'Value']);
    });

    it('shows deviation next to the value and unavailable rows as Unavailable', () => {
        renderTable(<StatsTable mode="grouped" rows={[
            row({ deviation: 60000, unit: 'milliseconds', value: 120000 }),
            row({ available: false, identity: 'claude', value: 0 }),
        ]} />);

        expect(bodyRowTexts()).toEqual([
            ['18 Aug', `${formatDurationHms(120000)} ± ${formatDurationHms(60000)}`],
            ['18 Aug', 'Unavailable'],
        ]);
    });

    it('adds a Total row after each bucket stack in stacked mode', () => {
        renderTable(<StatsTable mode="stacked" rows={[
            row({ identity: 'review', seriesLabel: 'Review', unit: 'actions', value: 2 }),
            row({ identity: 'test', seriesLabel: 'Test', unit: 'actions', value: 3 }),
            row({ displayLabel: '19 Aug', identity: 'review', seriesLabel: 'Review', unit: 'actions', utcBucketStart: '2026-08-19T00:00:00.000Z', value: 4 }),
        ]} />);

        expect(bodyRowTexts()).toEqual([
            ['18 Aug', 'Review', '2'],
            ['18 Aug', 'Test', '3'],
            ['18 Aug', 'Total', '5'],
            ['19 Aug', 'Review', '4'],
            ['19 Aug', 'Total', '4'],
        ]);
    });

    it('adds a Total row per agent stack in grouped-stacked mode', () => {
        renderTable(<StatsTable mode="groupedStacked" rows={[
            row({ identity: 'codex-review', seriesLabel: 'Review', stackIdentity: 'agent:codex', stackLabel: 'codex', unit: 'milliseconds', value: 1000 }),
            row({ identity: 'claude-review', seriesLabel: 'Review', stackIdentity: 'agent:claude', stackLabel: 'claude', unit: 'milliseconds', value: 3000 }),
            row({ identity: 'codex-test', seriesLabel: 'Test', stackIdentity: 'agent:codex', stackLabel: 'codex', unit: 'milliseconds', value: 2000 }),
        ]} />);

        expect(bodyRowTexts()).toEqual([
            ['18 Aug', 'codex – Review', formatDurationHms(1000)],
            ['18 Aug', 'codex – Test', formatDurationHms(2000)],
            ['18 Aug', 'codex – Total', formatDurationHms(3000)],
            ['18 Aug', 'claude – Review', formatDurationHms(3000)],
            ['18 Aug', 'claude – Total', formatDurationHms(3000)],
        ]);
    });
});

describe('StatsUsageComparisonTables', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders one titled table per comparison chart in chart order with rows of its role', () => {
        renderTable(<StatsUsageComparisonTables rows={[
            row({ chartRole: 'accountUsage', displayLabel: 'Account bucket', unit: 'percent', value: 50 }),
            row({ chartRole: 'tokensPerDollar', displayLabel: 'Dollar bucket', unit: 'tokensPerDollar', value: 7 }),
        ]} />);

        const labels = USAGE_COMPARISON_SECTIONS.map(({ label }) => label);
        expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(labels);
        expect(screen.getAllByRole('table')).toHaveLength(labels.length);
        expect(within(screen.getByRole('table', { name: 'Account usage table' })).getByRole('cell', { name: 'Account bucket' })).toBeInTheDocument();
        expect(within(screen.getByRole('table', { name: 'Account usage table' })).queryByRole('cell', { name: 'Dollar bucket' })).toBeNull();
        expect(within(screen.getByRole('table', { name: 'Tokens per dollar table' })).getByRole('cell', { name: 'Dollar bucket' })).toBeInTheDocument();
    });
});
