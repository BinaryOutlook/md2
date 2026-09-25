import { describe, expect, it } from 'vitest';
import { INITIAL_CONTROLS, type StatsControls } from '../../services/stats/project_stats_types';
import { statsValueLabel } from './stats_value_label';

describe('statsValueLabel', () => {
    it('names the selected metric of each single-chart dataset', () => {
        const controls: StatsControls = { ...INITIAL_CONTROLS, activityMetric: 'actions', performanceMetric: 'toolCalls', totalsMetric: 'cost' };

        expect(statsValueLabel('activityOverTime', controls)).toBe('Completed actions');
        expect(statsValueLabel('agentPerformance', controls)).toBe('Tool calls');
        expect(statsValueLabel('totals', controls)).toBe('Estimated cost');
    });
});
