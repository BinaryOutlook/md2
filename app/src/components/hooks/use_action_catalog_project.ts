import type { ActionRunSettingsStore } from '../../services/actions/action_run_settings_service';
import { useCardWorktreeIndexByInternalId } from '../card_view/use_project_card';
import { useProjectReference } from './use_project_reference';
import { useProjectActionWorktree, useWorktrees } from './use_worktrees';
import { useMergeConflict } from './use_merge_conflict';

/** Discover capabilities in the same assigned checkout as a card or project action. */
export function useActionCatalogProject(store: ActionRunSettingsStore) {
    const project = useProjectReference();
    const cardWorktree = useCardWorktreeIndexByInternalId(store.cardInternalId);
    const projectWorktree = useProjectActionWorktree();
    const records = useWorktrees();
    const { session } = useMergeConflict();
    if (project && store.contextKind === 'merge-conflict') {
        if (!session) return { error: 'Merge conflict model discovery requires an active session', project: null };
        const branch = session.repositoryRoot === project.rootPath ? project.branch : records[session.worktree - 1]?.branch;
        if (!branch) return { error: 'Merge conflict checkout is unavailable', project: null };

        return { error: null, project: { ...project, branch, id: session.repositoryRoot, rootPath: session.repositoryRoot } };
    }
    const worktree = store.contextKind === 'card' ? cardWorktree : store.contextKind === 'project' ? projectWorktree : null;
    if (!project || worktree === null) return { error: null, project };
    const record = records[worktree - 1];
    if (!record?.valid || !record.branch) return { error: record?.error ?? 'Selected worktree is unavailable', project: null };

    return { error: null, project: { ...project, branch: record.branch, id: record.path, rootPath: record.path } };
}
