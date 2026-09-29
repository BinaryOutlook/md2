import { Box } from '@mui/material'
import { useSyncExternalStore } from 'react'
import { diagramSelectionService, type DiagramSelectionService } from '../../../services/diagrams/diagram_selection_service'

/** Shows shared bounds for multiple selected diagram objects without taking pointer input. */
export function DiagramSelectionBoundary({ selection = diagramSelectionService }: { selection?: DiagramSelectionService }) {
    const boundary = useSyncExternalStore(
        selection.subscribeBoundary,
        selection.getBoundarySnapshot,
        selection.getBoundarySnapshot,
    )
    if (!boundary) return null

    return (
        <Box
            aria-label="Selected diagram objects boundary"
            data-testid="diagram-selection-boundary"
            sx={{
                border: '2px solid', borderColor: 'primary.main', height: boundary.height, left: boundary.x,
                pointerEvents: 'none', position: 'absolute', top: boundary.y, width: boundary.width, zIndex: 3,
            }}
        />
    )
}
