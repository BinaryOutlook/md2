import { register } from '../service_injector'
import {
    diagramEditSessionService,
    type DiagramEditSessionService,
} from './diagram_edit_session_service'
import type {
    ReadonlyDiagramData,
} from './diagram_edit_types'
import { parseDiagramData, serializeDiagramData, type DiagramData } from './diagram_data'
import { dialogService } from '../dialog_service'
import {
    diagramViewService,
    type DiagramViewService,
    type SaveEditedDiagramCopyRequest,
} from './diagram_view_service'

const SAVE_STATUS_CHANGED_EVENT = 'diagramSaveStatusChanged'

export type DiagramSaveStatus = 'idle' | 'saving'

type DiagramSaveSession = Pick<DiagramEditSessionService,
    | 'acknowledgeSavedCopy'
    | 'getDirtySnapshot'
    | 'getEditableDiagram'
    | 'getOriginalDiagramSnapshot'
    | 'getSavedRecordSnapshot'
    | 'getSessionSnapshot'
    | 'subscribeModelMutation'
>

type DiagramCopyPersistence = Pick<DiagramViewService, 'flushQueuedDiagrams' | 'queueEditedDiagramCopy'>
type DiagramSerializer = (diagram: ReadonlyDiagramData) => string

function canonicalDiagramContent(diagram: ReadonlyDiagramData) {
    return serializeDiagramData(diagram as DiagramData)
}

/** Owns explicit edited-diagram save progress and coordinates session acknowledgement. */
export class DiagramSaveService extends EventTarget {
    private readonly persistence: DiagramCopyPersistence
    private readonly serialize: DiagramSerializer
    private readonly session: DiagramSaveSession
    private status: DiagramSaveStatus = 'idle'
    private queuePromise: Promise<void> = Promise.resolve()
    private queuedSession: ReturnType<DiagramSaveSession['getSessionSnapshot']> = null

    constructor(
        session: DiagramSaveSession = diagramEditSessionService,
        persistence: DiagramCopyPersistence = diagramViewService,
        serialize: DiagramSerializer = canonicalDiagramContent,
    ) {
        super()
        this.persistence = persistence
        this.serialize = serialize
        this.session = session
        this.session.subscribeModelMutation(this.handleModelMutation)
    }

    getStatusSnapshot = () => this.status

    subscribeStatus = (listener: () => void) => {
        this.addEventListener(SAVE_STATUS_CHANGED_EVENT, listener)

        return () => this.removeEventListener(SAVE_STATUS_CHANGED_EVENT, listener)
    }

    async save() {
        if (this.status === 'saving') throw new Error('Diagram save is already in progress')
        if (!this.session.getDirtySnapshot()) throw new Error('Cannot save a diagram without changes')
        this.setStatus('saving')
        try {
            await this.enqueue()
            await this.persistence.flushQueuedDiagrams()

            return this.session.getSavedRecordSnapshot()
        } finally {
            this.setStatus('idle')
        }
    }

    private readonly handleModelMutation = () => {
        void this.enqueue().catch((error: unknown) => {
            dialogService.error(error, { fallbackMessage: 'Edited diagram could not be queued' })
        })
    }

    private enqueue() {
        const previous = this.queuePromise
        const current = this.queueAfter(previous)
        this.queuePromise = current

        return current
    }

    private async queueAfter(previous: Promise<void>) {
        try {
            await previous
        } catch {
            // A later edit may retry after an earlier queue attempt fails.
        }
        await this.queueCurrent()
    }

    private async queueCurrent() {
        const editSession = this.session.getSessionSnapshot()
        if (!editSession) throw new Error('Cannot save without an active diagram edit session')
        if (!this.session.getDirtySnapshot() && this.queuedSession !== editSession) return
        const editableDiagram = this.session.getEditableDiagram()
        const originalDiagram = this.session.getOriginalDiagramSnapshot()
        if (!editableDiagram || !originalDiagram) throw new Error('Cannot save without an active diagram edit session')
        const content = this.serialize(editableDiagram)
        const savedDiagram = parseDiagramData(content)
        const request: SaveEditedDiagramCopyRequest = {
            content,
            savedRecord: this.session.getSavedRecordSnapshot(),
            sourceRecord: originalDiagram.record,
        }
        await this.persistence.queueEditedDiagramCopy(request, (record) => {
            if (this.session.getSessionSnapshot() !== editSession) return
            const currentDiagram = this.session.getEditableDiagram()
            const savedDataIsCurrent = !!currentDiagram && this.serialize(currentDiagram) === content
            this.session.acknowledgeSavedCopy(record, savedDiagram, savedDataIsCurrent)
        })
        this.queuedSession = editSession
    }

    private setStatus(status: DiagramSaveStatus) {
        if (status === this.status) return

        this.status = status
        this.dispatchEvent(new Event(SAVE_STATUS_CHANGED_EVENT))
    }
}

export const diagramSaveService = register('diagramSaveService', new DiagramSaveService())
