import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import type { ChangeEvent } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ActionRunEvent } from '../../../data/action_run_types'
import { getElectronActionBridge } from '../../../data/electron_action_bridge'
import { actionVersionRequestService } from '../../../services/actions/action_version_request_service'
import { configService } from '../../../services/config/config_service'
import { dialogService } from '../../../services/dialog_service'

type VersionRequestEvent = Extract<ActionRunEvent, { type: 'inputRequest' }>

function PendingVersionDialog({ request }: { request: VersionRequestEvent }) {
    const [version, setVersion] = useState(() => configService.get('project.lastVersion'))
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => setVersion(event.target.value)
    const handleCancel = async () => {
        actionVersionRequestService.remove(request.runId)
        try {
            await getElectronActionBridge()?.cancelActionRun(request.runId)
        } catch (error) {
            dialogService.error(error, { fallbackMessage: 'Could not cancel action' })
        }
    }
    const handleConfirm = async () => {
        if (version.trim().length === 0) return
        actionVersionRequestService.remove(request.runId)
        try {
            await configService.setProjectPreference('project.lastVersion', version)
        } catch (error) {
            dialogService.error(error, { fallbackMessage: 'Could not save last version' })
        }
        try {
            const bridge = getElectronActionBridge()
            if (!bridge?.answerActionInput) throw new Error('Action input requires Electron')
            const response = { type: request.inputType, value: version }
            await bridge.answerActionInput(request.runId, response)
        } catch (error) {
            dialogService.error(error, { fallbackMessage: 'Could not submit version' })
        }
    }

    useEffect(() => {
        const handleWindowClose = () => { void getElectronActionBridge()?.cancelActionRun(request.runId) }
        window.addEventListener('beforeunload', handleWindowClose)

        return () => window.removeEventListener('beforeunload', handleWindowClose)
    }, [request.runId])

    return (
        <Dialog fullWidth maxWidth="xs" onClose={handleCancel} open>
            <DialogTitle>{request.prompt}</DialogTitle>
            <DialogContent>
                <TextField autoFocus fullWidth label="Version" onChange={handleChange} size="small" value={version} />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button disabled={version.trim().length === 0} onClick={handleConfirm} variant="contained">Confirm</Button>
            </DialogActions>
        </Dialog>
    )
}

/** Shows oldest pending run request; later requests wait their turn. */
export function ActionVersionDialog() {
    const requests = useSyncExternalStore(actionVersionRequestService.subscribe, actionVersionRequestService.getSnapshot)
    const request = requests[0]

    return request ? <PendingVersionDialog key={request.runId} request={request} /> : null
}
