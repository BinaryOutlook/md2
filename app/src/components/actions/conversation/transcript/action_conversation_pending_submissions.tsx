import { useSyncExternalStore } from 'react'
import type { ActionConversationChatlogTracker } from './action_conversation_chatlog_tracker'
import { ActionPendingSubmissionRow } from './action_pending_submission_row'

interface ActionConversationPendingSubmissionsProps {
    tracker: ActionConversationChatlogTracker
}

/** Subscribes only pending rows to submission changes. */
export function ActionConversationPendingSubmissions({ tracker }: ActionConversationPendingSubmissionsProps) {
    const submissions = useSyncExternalStore(
        tracker.subscribeSubmissions,
        tracker.getSubmissions,
        tracker.getSubmissions,
    )

    return submissions.map((submission) => <ActionPendingSubmissionRow key={submission.id} submission={submission} />)
}
