import type { StatsChartRow } from '../../services/stats/project_stats_types';

export type StatsBarMode = 'grouped' | 'groupedStacked' | 'single' | 'stacked';

export interface BucketRows {
    identity: string;
    label: string;
    rows: StatsChartRow[];
}

export interface BarRows {
    identity: string;
    label: string | null;
    rows: StatsChartRow[];
}

/** Groups rows by time bucket (or row identity for bucketless rows), keeping first-seen order. */
export function bucketRows(rows: StatsChartRow[]) {
    const buckets = new Map<string, BucketRows>();
    for (const row of rows) {
        const identity = row.utcBucketStart ?? row.identity;
        const current = buckets.get(identity) ?? { identity, label: row.displayLabel, rows: [] };
        current.rows.push(row);
        buckets.set(identity, current);
    }

    return [...buckets.values()];
}

function groupedStackedBars(rows: StatsChartRow[]) {
    const groups = new Map<string, BarRows>();
    for (const row of rows) {
        const identity = row.stackIdentity ?? row.identity;
        const current = groups.get(identity) ?? { identity, label: row.stackLabel, rows: [] };
        current.rows.push(row);
        groups.set(identity, current);
    }

    return [...groups.values()];
}

/** Splits one bucket into the bars (or stacks) the given mode draws. */
export function barsForBucket(bucket: BucketRows, mode: StatsBarMode): BarRows[] {
    if (mode === 'stacked') return [{ identity: bucket.identity, label: null, rows: bucket.rows }];
    if (mode === 'groupedStacked') return groupedStackedBars(bucket.rows);

    return bucket.rows.map((row, index) => ({ identity: `${row.identity}:${index}`, label: null, rows: [row] }));
}

/** Stack height: the sum of the positive segment values. */
export function barTotal(bar: BarRows) {
    return bar.rows.reduce((total, row) => total + Math.max(row.value, 0), 0);
}
