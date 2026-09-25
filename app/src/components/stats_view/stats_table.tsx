import { Table, TableBody, TableCell, TableHead, TableRow, type SxProps, type Theme } from '@mui/material';
import type { StatsChartRow } from '../../services/stats/project_stats_types';
import { barsForBucket, barTotal, bucketRows, type BarRows, type BucketRows, type StatsBarMode } from './stats_bar_groups';
import { formattedDeviation, formattedValue, stackTotalLabel } from './stats_value_format';

const HEADER_CELL_SX: SxProps<Theme> = { borderColor: 'divider', color: 'custom.colHead', fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' };
/** Card paths and ids have no spaces; without breaking anywhere they push the value column off screen. */
const WRAPPING_CELL_OVERFLOW = 'anywhere';
const SERIES_SEPARATOR = ' – ';
const TOTAL_FONT_WEIGHT = 700;
const TOTAL_LABEL = 'Total';

interface StatsTableProps {
    ariaLabel?: string;
    mode?: StatsBarMode;
    rows: StatsChartRow[];
    shortTokenCounts?: boolean;
    valueLabel: string;
}

interface TableEntry {
    isTotal: boolean;
    key: string;
    period: string;
    series: string;
    value: string;
}

function seriesText(row: StatsChartRow) {
    return [row.stackLabel, row.seriesLabel].filter((label) => !!label).join(SERIES_SEPARATOR);
}

function valueText(row: StatsChartRow, shortTokenCounts: boolean) {
    const deviation = formattedDeviation(row, shortTokenCounts);
    const value = formattedValue(row, shortTokenCounts);

    return deviation ? `${value} ${deviation}` : value;
}

function totalEntry(bucket: BucketRows, bar: BarRows, mode: StatsBarMode, shortTokenCounts: boolean): TableEntry {
    const series = mode === 'groupedStacked' && bar.label ? `${bar.label}${SERIES_SEPARATOR}${TOTAL_LABEL}` : TOTAL_LABEL;
    const value = stackTotalLabel(bar.rows[0].unit, barTotal(bar), shortTokenCounts);

    return { isTotal: true, key: `${bucket.identity}:${bar.identity}:total`, period: bucket.label, series, value };
}

/** Flattens rows in chart order, adding one total entry after each stack's segments. Keys include the bucket: series repeat per period. */
function tableEntries(rows: StatsChartRow[], mode: StatsBarMode, shortTokenCounts: boolean) {
    const stacked = mode === 'stacked' || mode === 'groupedStacked';
    const entries: TableEntry[] = [];
    for (const bucket of bucketRows(rows)) {
        for (const bar of barsForBucket(bucket, mode)) {
            bar.rows.forEach((row, index) => entries.push({
                isTotal: false,
                key: `${bucket.identity}:${bar.identity}:${row.identity}:${index}`,
                period: bucket.label,
                series: seriesText(row),
                value: valueText(row, shortTokenCounts),
            }));
            if (stacked) entries.push(totalEntry(bucket, bar, mode, shortTokenCounts));
        }
    }

    return entries;
}

/** Readable table rendering of stats rows for small screens. */
export function StatsTable({ ariaLabel = 'Stats table', mode = 'single', rows, shortTokenCounts = false, valueLabel }: StatsTableProps) {
    const entries = tableEntries(rows, mode, shortTokenCounts);
    const showSeries = entries.some(({ series }) => series !== '');

    return (
        <Table aria-label={ariaLabel} size="small" stickyHeader>
            <TableHead>
                <TableRow>
                    <TableCell sx={HEADER_CELL_SX}>Period / label</TableCell>
                    {showSeries ? <TableCell sx={HEADER_CELL_SX}>Series</TableCell> : null}
                    <TableCell align="right" sx={HEADER_CELL_SX}>{valueLabel}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {entries.map(({ isTotal, key, period, series, value }) => {
                    const fontWeight = isTotal ? TOTAL_FONT_WEIGHT : undefined;

                    return (
                        <TableRow key={key}>
                            <TableCell sx={{ borderColor: 'divider', color: 'text.primary', fontWeight, overflowWrap: WRAPPING_CELL_OVERFLOW }}>{period}</TableCell>
                            {showSeries ? <TableCell sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight, overflowWrap: WRAPPING_CELL_OVERFLOW }}>{series}</TableCell> : null}
                            <TableCell align="right" sx={{ borderColor: 'divider', color: 'text.primary', fontWeight, whiteSpace: 'nowrap' }}>{value}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
