import type { StatsChartRow, StatsUnit } from '../../services/stats/project_stats_types';
import { formatDurationHms } from '../../services/stats/stats_tooltip';
import { formatTokenCount } from '../agents/token_count_format';

/** True for counts of tokens only; the `tokensPer…` units are ratios and keep their decimals. */
export function abbreviatesTokens(unit: StatsUnit, shortTokenCounts: boolean) {
    return shortTokenCounts && unit === 'tokens';
}

function formattedNumber(unit: StatsUnit, value: number, shortTokenCounts: boolean) {
    if (abbreviatesTokens(unit, shortTokenCounts)) return formatTokenCount(value);
    if (unit === 'milliseconds') return formatDurationHms(value);
    if (unit === 'percent') {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)}%`;
    }
    if (unit === 'dollars') {
        return new Intl.NumberFormat(undefined, { currency: 'USD', style: 'currency' }).format(value);
    }

    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

/** Row value in its unit's display format, or `Unavailable` for rows without data. */
export function formattedValue(row: StatsChartRow, shortTokenCounts: boolean) {
    if (!row.available) return 'Unavailable';

    return formattedNumber(row.unit, row.value, shortTokenCounts);
}

/** `± deviation` in the row's unit format, or null when the row has no deviation to show. */
export function formattedDeviation(row: StatsChartRow, shortTokenCounts: boolean) {
    if (!row.available || row.deviation === null) return null;

    return `± ${formattedNumber(row.unit, row.deviation, shortTokenCounts)}`;
}

/** Stacked bars label their full height; duration stacks read HH:MM:SS like their individual rows. */
export function stackTotalLabel(unit: StatsUnit, total: number, shortTokenCounts: boolean) {
    if (abbreviatesTokens(unit, shortTokenCounts)) return formatTokenCount(total);
    if (unit === 'milliseconds') return formatDurationHms(total);

    return new Intl.NumberFormat().format(total);
}
