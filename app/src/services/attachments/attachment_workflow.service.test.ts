import { afterEach, describe, expect, it, vi } from 'vitest'
import { dataService } from '../data/data_service'
import type { Card } from '../../data/data_types'
import { attachmentChoiceService } from './attachment_choice_service'
import {
    absoluteFileUrl,
    attachFilesToBoardCardMarkdown,
    attachFilesToCardMarkdown,
    attachFilesToOriginalMarkdown,
} from './attachment_workflow'
import { MarkdownDraft } from '../markdown/markdown_draft'

function boardCard(): Card {
    return {
        agentConversationErrors: [], agentConversations: [], content: '# Card\n\nCurrent body',
        hasFrontmatter: true, isActive: true, path: 'design/F-1.md',
        header: {
            affects: [], after: null, agentLogReferences: [], changedFiles: [], author: null,
            id: 'F-1', internalId: 'card-1', owner: null, policy: {}, references: ['design/old.pdf'],
            status: 'ready', title: 'Card', worktree: null, worktreeError: null, worktreeValue: null,
        },
    }
}

function mockBoardCard(card: Card) {
    vi.spyOn(dataService, 'getState').mockReturnValue({
        project: { branch: 'main', id: 'project' }, runningAgents: [],
        snapshot: { activeCards: [card], backgroundCards: [], repositoryFiles: [], workingFolder: 'design' },
    })
    vi.spyOn(dataService.cards, 'updateCardBody').mockImplementation((_path, body) => {
        card.content = body
        return card
    })
    vi.spyOn(dataService.cards, 'flushPendingCommits').mockResolvedValue()
}

afterEach(() => {
    attachmentChoiceService.cancel()
    delete window.md2Files
    vi.restoreAllMocks()
})

describe('attachment workflow', () => {
    it('formats Windows, UNC, and POSIX absolute file URLs', () => {
        expect(absoluteFileUrl('C:\\source folder\\report.pdf')).toBe('file:///C:/source%20folder/report.pdf')
        expect(absoluteFileUrl('\\\\server\\share\\report.pdf')).toBe('file://server/share/report.pdf')
        expect(absoluteFileUrl('/var/data/report.pdf')).toBe('file:///var/data/report.pdf')
    })

    it('inserts original image and file links without repository writes', async () => {
        const files = [
            new File(['image'], 'screen shot.png', { type: 'image/png' }),
            new File(['text'], 'notes.txt', { type: 'text/plain' }),
        ]
        window.md2Files = { getPathForFile: (file) => `C:\\source folder\\${file.name}` }
        const copyAttachments = vi.spyOn(dataService.cards, 'copyAttachmentsForCard')
        const insertMarkdown = vi.fn()

        const operation = attachFilesToCardMarkdown('design/F-1.md', files, insertMarkdown)
        attachmentChoiceService.select('original')
        await operation

        expect(insertMarkdown).toHaveBeenCalledWith(
            '![screen shot.png](<file:///C:/source%20folder/screen%20shot.png>)\n'
            + '[notes.txt](<file:///C:/source%20folder/notes.txt>)',
        )
        expect(copyAttachments).not.toHaveBeenCalled()
    })

    it('inserts original links without requiring a card copy destination', async () => {
        const files = [new File(['notes'], 'notes.txt', { type: 'text/plain' })]
        window.md2Files = { getPathForFile: () => 'C:\\source folder\\notes.txt' }
        const insertMarkdown = vi.fn()

        await attachFilesToOriginalMarkdown(files, insertMarkdown)

        expect(insertMarkdown).toHaveBeenCalledWith('[notes.txt](<file:///C:/source%20folder/notes.txt>)')
    })

    it('fails original-only attachment when trusted file paths are unavailable', async () => {
        const operation = attachFilesToOriginalMarkdown([new File(['notes'], 'notes.txt')], vi.fn())

        await expect(operation).rejects.toThrow('Original attachment paths are unavailable')
    })

    it('removes copied files when Markdown insertion fails', async () => {
        const file = new File(['report'], 'report.pdf', { type: 'application/pdf' })
        vi.spyOn(dataService.cards, 'copyAttachmentsForCard').mockResolvedValue([
            { fileName: 'report.pdf', path: 'design/report.pdf' },
        ])
        const deleteAttachments = vi.spyOn(dataService.cards, 'deleteCopiedAttachments').mockResolvedValue()
        const insertionError = new Error('insert failed')

        const operation = attachFilesToCardMarkdown('design/F-1.md', [file], () => {
            throw insertionError
        })
        attachmentChoiceService.select('copy')

        await expect(operation).rejects.toBe(insertionError)
        expect(deleteAttachments).toHaveBeenCalledWith(['design/report.pdf'])
    })

    it('removes copied files when no mounted editor handles draft insertion', async () => {
        const file = new File(['report'], 'report.pdf', { type: 'application/pdf' })
        const draft = new MarkdownDraft('')
        vi.spyOn(dataService.cards, 'copyAttachmentsForCard').mockResolvedValue([
            { fileName: 'report.pdf', path: 'design/report.pdf' },
        ])
        const deleteAttachments = vi.spyOn(dataService.cards, 'deleteCopiedAttachments').mockResolvedValue()
        const operation = attachFilesToCardMarkdown('design/F-1.md', [file], draft.requestInsertion)
        attachmentChoiceService.select('copy')

        await expect(operation).rejects.toThrow('Markdown insertion requires a mounted editor')
        expect(deleteAttachments).toHaveBeenCalledWith(['design/report.pdf'])
    })

    it('appends copied image and file links to latest body without changing header references', async () => {
        const card = boardCard()
        mockBoardCard(card)
        const files = [new File(['image'], 'image.png', { type: 'image/png' }), new File(['notes'], 'notes.pdf', { type: 'application/pdf' })]
        vi.spyOn(dataService.cards, 'copyAttachmentsForCard').mockResolvedValue([
            { fileName: 'image-1.png', path: 'design/image-1.png' },
            { fileName: 'notes.pdf', path: 'design/notes.pdf' },
        ])
        const addReferences = vi.spyOn(dataService.cards, 'addCardReferences')
        const operation = attachFilesToBoardCardMarkdown('card-1', files)
        attachmentChoiceService.select('copy')

        await expect(operation).resolves.toBe(true)
        expect(card.content).toBe('# Card\n\nCurrent body\n![image.png](<image-1.png>)\n[notes.pdf](<notes.pdf>)\n')
        expect(card.header.references).toEqual(['design/old.pdf'])
        expect(addReferences).not.toHaveBeenCalled()
    })

    it('appends original links to latest body without copying files', async () => {
        const card = boardCard()
        mockBoardCard(card)
        window.md2Files = { getPathForFile: () => 'C:\\source\\notes.pdf' }
        const copyAttachments = vi.spyOn(dataService.cards, 'copyAttachmentsForCard')
        const operation = attachFilesToBoardCardMarkdown('card-1', [new File(['notes'], 'notes.pdf')])
        attachmentChoiceService.select('original')

        await expect(operation).resolves.toBe(true)
        expect(card.content).toContain('[notes.pdf](<file:///C:/source/notes.pdf>)')
        expect(copyAttachments).not.toHaveBeenCalled()
    })

    it('uses body edits made while attachment choice is open', async () => {
        const card = boardCard()
        mockBoardCard(card)
        window.md2Files = { getPathForFile: () => 'C:\\source\\notes.pdf' }
        const operation = attachFilesToBoardCardMarkdown('card-1', [new File(['notes'], 'notes.pdf')])
        card.content = '# Card\n\nNewer body'
        attachmentChoiceService.select('original')

        await expect(operation).resolves.toBe(true)
        expect(card.content).toBe('# Card\n\nNewer body\n[notes.pdf](<file:///C:/source/notes.pdf>)\n')
    })

    it('cancel leaves card body, references, and repository unchanged', async () => {
        const card = boardCard()
        mockBoardCard(card)
        const addReferences = vi.spyOn(dataService.cards, 'addCardReferences')
        const copyAttachments = vi.spyOn(dataService.cards, 'copyAttachmentsForCard')
        const updateCardBody = vi.mocked(dataService.cards.updateCardBody)
        const operation = attachFilesToBoardCardMarkdown('card-1', [new File(['one'], 'one.pdf')])

        attachmentChoiceService.cancel()

        await expect(operation).resolves.toBe(false)
        expect(addReferences).not.toHaveBeenCalled()
        expect(copyAttachments).not.toHaveBeenCalled()
        expect(updateCardBody).not.toHaveBeenCalled()
        expect(card.content).toBe('# Card\n\nCurrent body')
        expect(card.header.references).toEqual(['design/old.pdf'])
    })

    it('restores body and cleans copied files when save fails', async () => {
        const card = boardCard()
        mockBoardCard(card)
        vi.spyOn(dataService.cards, 'copyAttachmentsForCard').mockResolvedValue([{ fileName: 'notes.pdf', path: 'design/notes.pdf' }])
        const deleteAttachments = vi.spyOn(dataService.cards, 'deleteCopiedAttachments').mockResolvedValue()
        vi.mocked(dataService.cards.flushPendingCommits).mockRejectedValueOnce(new Error('save failed'))
        const operation = attachFilesToBoardCardMarkdown('card-1', [new File(['notes'], 'notes.pdf')])
        attachmentChoiceService.select('copy')

        await expect(operation).rejects.toThrow('save failed')
        expect(card.content).toBe('# Card\n\nCurrent body')
        expect(card.header.references).toEqual(['design/old.pdf'])
        expect(deleteAttachments).toHaveBeenCalledWith(['design/notes.pdf'])
    })
})
