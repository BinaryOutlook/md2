import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionContext } from '../../data/action_context';
import type { WorktreeRecord } from '../../data/data_types';
import { ActionRunSettingsStore } from '../../services/actions/action_run_settings_service';
import { dataService } from '../../services/data/data_service';
import { mergeConflictService } from '../../services/project/merge_conflict_service';
import { worktreeService } from '../../services/project/worktree_service';
import { useActionCatalogProject } from './use_action_catalog_project';

const project = { branch: 'main', id: '/repo', rootPath: '/repo' };
const worktrees = [{ branch: 'topic', path: '/worktree', valid: true }] as WorktreeRecord[];
const conflict = {
    conflictedPaths: [], externalResolverConfigured: false, id: 'conflict-1',
    operation: 'rebase' as const, phase: 'rebase' as const, repositoryRoot: '/worktree', worktree: 1,
};

function catalogContext(kind: ActionContext['kind'], cardInternalId: string | null = null) {
    const store = new ActionRunSettingsStore('review', cardInternalId, kind);

    return renderHook(() => useActionCatalogProject(store)).result.current;
}

describe('action model discovery checkout', () => {
    beforeEach(() => {
        vi.spyOn(dataService, 'getState').mockReturnValue({
            project,
            snapshot: { activeCards: [{ header: { internalId: 'card-1', worktree: 1 } }] },
        } as unknown as ReturnType<typeof dataService.getState>);
        vi.spyOn(worktreeService, 'getRecords').mockReturnValue(worktrees);
        vi.spyOn(worktreeService, 'getProjectActionWorktree').mockReturnValue(1);
        vi.spyOn(mergeConflictService, 'getSnapshot').mockReturnValue({ busy: false, session: null });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('uses a card assignment identified by its canonical internal ID', () => {
        expect(catalogContext('card', 'card-1').project?.rootPath).toBe('/worktree');
        expect(catalogContext('card', 'other-card').project).toBe(project);
    });

    it('uses the project assignment while file actions retain the primary checkout', () => {
        expect(catalogContext('project').project?.rootPath).toBe('/worktree');
        expect(catalogContext('file').project).toBe(project);
    });

    it('blocks an unavailable assigned checkout instead of discovering in another one', () => {
        vi.mocked(worktreeService.getRecords).mockReturnValue([]);

        expect(catalogContext('card', 'card-1')).toEqual({ error: 'Selected worktree is unavailable', project: null });
    });

    it('uses the active conflict checkout and its branch', () => {
        vi.mocked(mergeConflictService.getSnapshot).mockReturnValue({ busy: false, session: conflict });

        expect(catalogContext('merge-conflict')).toEqual({error: null, project: { branch: 'topic', id: '/worktree', rootPath: '/worktree' }});
    });

    it('retains the primary branch when a conflict runs in the primary checkout', () => {
        vi.mocked(mergeConflictService.getSnapshot).mockReturnValue({busy: false, session: { ...conflict, repositoryRoot: '/repo' }});

        expect(catalogContext('merge-conflict').project).toEqual(project);
    });

    it('blocks conflict discovery when its session is no longer active', () => {
        expect(catalogContext('merge-conflict')).toEqual({error: 'Merge conflict model discovery requires an active session', project: null});
    });
});
