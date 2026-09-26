import type { ActionRunEvent } from '../../data/action_run_types'

type VersionRequestEvent = Extract<ActionRunEvent, { type: 'inputRequest' }>

/** Keeps pending run requests available through renderer event recovery. */
class ActionVersionRequestService extends EventTarget {
    private readonly requests = new Map<string, VersionRequestEvent>()
    private snapshot: VersionRequestEvent[] = []

    getSnapshot = () => this.snapshot

    subscribe = (listener: () => void) => {
        this.addEventListener('changed', listener)

        return () => this.removeEventListener('changed', listener)
    }

    request(event: VersionRequestEvent) {
        this.requests.set(event.runId, event)
        this.publish()
    }

    remove(runId: string) {
        if (!this.requests.delete(runId)) return
        this.publish()
    }

    clear() {
        if (this.requests.size === 0) return
        this.requests.clear()
        this.publish()
    }

    private publish() {
        this.snapshot = [...this.requests.values()]
        this.dispatchEvent(new Event('changed'))
    }
}

export const actionVersionRequestService = new ActionVersionRequestService()
