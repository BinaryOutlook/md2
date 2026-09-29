import { describe, expect, it } from 'vitest';
import type { StatsChartRow } from '../../services/stats/project_stats_types';
import { formatDurationHms } from '../../services/stats/stats_tooltip';
import { formatTokenCount } from '../agents/token_count_format';
import { formattedDeviation, formattedValue, stackTotalLabel } from './stats_value_format';

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
        utcBucketEnd: null,
        utcBucketStart: null,
        value: 428913,
        windowId: null,
        ...overrides,
    };
}

describe('formattedValue', () => {
    it('abbreviates token counts only while the short format is on', () => {
        expect(formattedValue(row(), true)).toBe(formatTokenCount(428913));
        expect(formattedValue(row(), false)).toBe(new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(428913));
    });

    it('formats durations, percents, and dollars by unit', () => {
        expect(formattedValue(row({ unit: 'milliseconds', value: 3723000 }), true)).toBe(formatDurationHms(3723000));
        expect(formattedValue(row({ unit: 'percent', value: 12.345 }), true)).toBe(`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(12.345)}%`);
        expect(formattedValue(row({ unit: 'dollars', value: 1.5 }), true)).toBe(new Intl.NumberFormat(undefined, { currency: 'USD', style: 'currency' }).format(1.5));
    });

    it('labels unavailable rows', () => {
        expect(formattedValue(row({ available: false, value: 0 }), true)).toBe('Unavailable');
    });
});

describe('formattedDeviation', () => {
    it('prefixes the deviation in the row unit format with ±', () => {
        expect(formattedDeviation(row({ deviation: 60000, unit: 'milliseconds', value: 120000 }), true)).toBe(`± ${formatDurationHms(60000)}`);
    });

    it('returns null without a deviation or for unavailable rows', () => {
        expect(formattedDeviation(row(), true)).toBeNull();
        expect(formattedDeviation(row({ available: false, deviation: 5 }), true)).toBeNull();
    });
});

describe('stackTotalLabel', () => {
    it('formats stack totals by unit', () => {
        expect(stackTotalLabel('tokens', 428913, true)).toBe(formatTokenCount(428913));
        expect(stackTotalLabel('milliseconds', 3723000, true)).toBe(formatDurationHms(3723000));
        expect(stackTotalLabel('actions', 1234, true)).toBe(new Intl.NumberFormat().format(1234));
    });
});
