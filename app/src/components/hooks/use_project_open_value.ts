import { useCallback, useSyncExternalStore } from 'react'
import { projectOpenFlowService, type ProjectOpenFlowState } from '../../services/project/project_open_flow_service'

/** Subscribes to one field of the project-opening workflow. */
export function useProjectOpenValue<Field extends keyof ProjectOpenFlowState>(field: Field): ProjectOpenFlowState[Field] {
    const subscribe = useCallback((onStoreChange: () => void) => {
        projectOpenFlowService.addEventListener(field, onStoreChange)

        return () => projectOpenFlowService.removeEventListener(field, onStoreChange)
    }, [field])
    const getSnapshot = useCallback(() => projectOpenFlowService.getValue(field), [field])

    return useSyncExternalStore(subscribe, getSnapshot)
}
