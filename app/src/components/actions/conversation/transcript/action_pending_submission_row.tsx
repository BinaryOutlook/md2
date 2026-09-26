import { Box, Stack, Typography } from '@mui/material'
import type { PendingActionSubmission } from '../state/action_conversation_store'

interface ActionPendingSubmissionRowProps {
    submission: PendingActionSubmission
}

/** Shows submitted text until its backend queue or sent message takes over. */
export function ActionPendingSubmissionRow({ submission }: ActionPendingSubmissionRowProps) {
    const label = submission.state === 'transmitting' ? 'In transmission'
        : submission.state === 'failed' ? 'Failed to send' : 'Queued'

    return (
        <Box
            aria-label="Pending prompt"
            sx={{
                alignSelf: 'flex-end', bgcolor: 'background.paper', border: 1, borderColor: 'divider',
                borderRadius: 1, flexShrink: 0, maxWidth: '88%', minWidth: 0, overflowWrap: 'anywhere',
                px: 1.25, py: 1,
            }}
        >
            <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography variant="body2">{submission.content}</Typography>
                {submission.error ? <Typography color="error" variant="caption">{submission.error}</Typography> : null}
            </Stack>
        </Box>
    )
}
