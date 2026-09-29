import { describe, expect, it } from 'vitest'
import { createDefaultActionFiles } from './project_template'

describe('createDefaultActionFiles', () => {
    it('bundles a project version action that asks for input and delegates script generation', () => {
        const files = createDefaultActionFiles('design/actions')
        const file = files.find(({ path }) => path === 'design/actions/update-project-version.json')
        if (!file) throw new Error('Missing bundled version action')
        const definition = JSON.parse(file.content) as { prompt: string, userInput: { type: string } }

        expect(definition.userInput.type).toBe('version')
        expect(definition.prompt).toContain('{{version}}')
        expect(definition.prompt).toContain('project-specific script')
    })
    it('uses portable repository paths when combining a bundled action path with card-file', () => {
        const files = createDefaultActionFiles('design/actions')
        const implementFile = files.find(({ path }) => path === 'design/actions/implement.json')
        if (!implementFile) throw new Error('Missing bundled implement action')

        const definition = JSON.parse(implementFile.content) as { prompt: string }

        expect(definition.prompt).toContain('{{repository-folder}}/{{card-file}}')
        expect(definition.prompt).not.toContain('{{project-folder}}\\{{card-file}}')
    })
    it('uses portable paths in the bundled release-note action', () => {
        const files = createDefaultActionFiles('design/actions')
        const file = files.find(({ path }) => path === 'design/actions/write-release-note.json')
        if (!file) throw new Error('Missing bundled release-note action')
        const definition = JSON.parse(file.content) as { prompt: string }

        expect(definition.prompt).toContain('{{repository-folder}}/desktop/package.json')
        expect(definition.prompt).toContain('releases/{VERSION}/release')
    })

})
