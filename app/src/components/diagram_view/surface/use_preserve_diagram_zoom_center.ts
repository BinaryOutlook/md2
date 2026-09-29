import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { DiagramZoomAnchor } from './use_diagram_pinch_zoom'

function scaledCenterOffset(offset: number, viewportSize: number, previousScale: number, scale: number) {
    return (offset + viewportSize / 2) * scale / previousScale - viewportSize / 2
}

/** Keeps viewport's visible diagram center stable across visual scale changes. */
export function usePreserveDiagramZoomCenter(
    scrollerRef: RefObject<HTMLElement | null>,
    scale: number,
    anchorRef?: RefObject<DiagramZoomAnchor | null>,
) {
    const previousScaleRef = useRef(scale)

    useLayoutEffect(() => {
        const previousScale = previousScaleRef.current
        previousScaleRef.current = scale
        if (previousScale === scale) return

        const scroller = scrollerRef.current
        if (!scroller) return

        const anchor = anchorRef?.current
        if (anchor) {
            const bounds = scroller.getBoundingClientRect()
            scroller.scrollLeft = anchor.diagramX * scale - (anchor.clientX - bounds.left)
            scroller.scrollTop = anchor.diagramY * scale - (anchor.clientY - bounds.top)
            return
        }

        scroller.scrollLeft = scaledCenterOffset(scroller.scrollLeft, scroller.clientWidth, previousScale, scale)
        scroller.scrollTop = scaledCenterOffset(scroller.scrollTop, scroller.clientHeight, previousScale, scale)
    }, [anchorRef, scale, scrollerRef])
}
