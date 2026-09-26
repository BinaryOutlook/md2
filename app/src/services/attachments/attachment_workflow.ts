import type { SavedCardAttachment } from '../data/card_attachment_operations'
import { copyAndApplyAttachments } from '../data/card_attachment_operations'
import { dataService } from '../data/data_service'
import { attachmentChoiceService } from './attachment_choice_service'
import { getOriginalFilePaths } from '../../data/electron_file_bridge'
import { openFilesService } from '../open_files_service'

export type AttachmentMarkdownInserter = (markdown: string) => void | Promise<void>

function escapeMarkdownLabel(label: string) {
    return label.replace(/([\\\]])/gu, '\\$1')
}

/** Converts a trusted absolute filesystem path to Markdown's absolute file URL form. */
export function absoluteFileUrl(filePath: string) {
    const normalizedPath = filePath.replace(/\\/gu, '/')
    const encodedPath = encodeURI(normalizedPath).replace(/#/gu, '%23').replace(/\?/gu, '%3F')
    if (normalizedPath.startsWith('//')) return `file:${encodedPath}`
    if (/^[a-z]:\//iu.test(normalizedPath)) return `file:///${encodedPath}`
    if (normalizedPath.startsWith('/')) return `file://${encodedPath}`

    throw new Error(`Original attachment path is not absolute: ${filePath}`)
}

function attachmentMarkdown(files: File[], paths: string[], originalLocation: boolean) {
    return files.map((file, index) => {
        const target = originalLocation ? absoluteFileUrl(paths[index]) : paths[index]
        const label = escapeMarkdownLabel(file.name)

        return file.type.toLowerCase().startsWith('image/')
            ? `![${label}](<${target}>)`
            : `[${label}](<${target}>)`
    }).join('\n')
}

/** Appends dropped links to the latest body of one board card and persists the edit. */
export async function attachFilesToBoardCardMarkdown(cardInternalId: string, files: File[]) {
    if (files.length === 0) return false
    const selectedCard = dataService.getState().snapshot?.activeCards.find(({ header }) => header.internalId === cardInternalId)
    if (!selectedCard) throw new Error(`Cannot attach files to an unloaded card: ${cardInternalId}`)
    let inserted = false
    const insertMarkdown = async (markdown: string) => {
        const card = dataService.getState().snapshot?.activeCards.find(({ header }) => header.internalId === cardInternalId)
        if (!card) throw new Error(`Cannot attach files to an unloaded card: ${cardInternalId}`)
        const document = openFilesService.findDocument(card)
        const previousBody = document?.kind === 'card' && document.dirty ? document.getDraft().content : card.content
        const separator = previousBody.length === 0 || previousBody.endsWith('\n') ? '' : '\n'
        const nextBody = `${previousBody}${separator}${markdown}\n`
        try {
            dataService.cards.updateCardBody(card.path, nextBody)
            await dataService.cards.flushPendingCommits()
            inserted = true
        } catch (error) {
            dataService.cards.updateCardBody(card.path, previousBody)
            throw error
        }
    }

    await attachFilesToCardMarkdown(selectedCard.path, files, insertMarkdown)
    return inserted
}

async function insertCopiedMarkdown(
    files: File[],
    attachments: SavedCardAttachment[],
    insertMarkdown: AttachmentMarkdownInserter,
) {
    await insertMarkdown(attachmentMarkdown(files, attachments.map(({ fileName }) => fileName), false))
}

/** Runs Markdown attachment choice for an existing card-backed editor. */
export async function attachFilesToCardMarkdown(
    cardPath: string,
    files: File[],
    insertMarkdown: AttachmentMarkdownInserter,
) {
    const selection = await attachmentChoiceService.choose(files)
    if (!selection) return

    if (selection.choice === 'original') {
        if (!selection.originalPaths) throw new Error('Original attachment paths are unavailable')
        await insertMarkdown(attachmentMarkdown(files, selection.originalPaths, true))
        return
    }

    await copyAndApplyAttachments(
        files,
        (selectedFiles) => dataService.cards.copyAttachmentsForCard(cardPath, selectedFiles),
        (attachments) => insertCopiedMarkdown(files, attachments, insertMarkdown),
        (paths) => dataService.cards.deleteCopiedAttachments(paths),
    )
}

/** Inserts absolute attachment links when no project copy destination exists. */
export async function attachFilesToOriginalMarkdown(files: File[], insertMarkdown: AttachmentMarkdownInserter) {
    const originalPaths = getOriginalFilePaths(files)
    if (!originalPaths) throw new Error('Original attachment paths are unavailable')

    await insertMarkdown(attachmentMarkdown(files, originalPaths, true))
}

export { attachmentMarkdown }
