import { useProjectOpenValue } from './use_project_open_value'

/** Subscribes only to the project-opening workflow phase. */
export function useProjectOpenPhase() {
    return useProjectOpenValue('phase')
}
