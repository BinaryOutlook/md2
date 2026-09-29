import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { prepareNativeHelpers } = require('./prepare_native_helpers');
const PACKAGE_DIRECTORY = path.resolve('fixture', 'node-pty');

function mockFileSystem(files = {}) {
    return {
        chmodSync: vi.fn(),
        lstatSync: vi.fn((filePath) => {
            const entry = files[filePath];
            if (!entry) throw Object.assign(new Error('Missing fixture file'), { code: 'ENOENT' });

            return { isFile: () => entry.regular !== false, mode: entry.mode };
        }),
    };
}

describe('prepareNativeHelpers', () => {
    it.each(['arm64', 'x64'])('repairs the macOS %s helper without changing other permission bits', (arch) => {
        const helper = path.join(PACKAGE_DIRECTORY, `prebuilds/darwin-${arch}`, 'spawn-helper');
        const fileSystem = mockFileSystem({ [helper]: { mode: 0o640 } });

        prepareNativeHelpers({ arch, fileSystem, packageDirectory: PACKAGE_DIRECTORY, platform: 'darwin' });

        expect(fileSystem.chmodSync).toHaveBeenCalledExactlyOnceWith(helper, 0o740);
    });

    it('repairs locally built helpers as well as prebuilt helpers', () => {
        const helper = path.join(PACKAGE_DIRECTORY, 'build/Release', 'spawn-helper');
        const fileSystem = mockFileSystem({ [helper]: { mode: 0o644 } });

        prepareNativeHelpers({ fileSystem, packageDirectory: PACKAGE_DIRECTORY, platform: 'darwin' });

        expect(fileSystem.chmodSync).toHaveBeenCalledExactlyOnceWith(helper, 0o744);
    });

    it('leaves an executable helper unchanged', () => {
        const helper = path.join(PACKAGE_DIRECTORY, 'prebuilds/darwin-arm64', 'spawn-helper');
        const fileSystem = mockFileSystem({ [helper]: { mode: 0o755 } });

        prepareNativeHelpers({ arch: 'arm64', fileSystem, packageDirectory: PACKAGE_DIRECTORY, platform: 'darwin' });

        expect(fileSystem.chmodSync).not.toHaveBeenCalled();
    });

    it.each(['linux', 'win32'])('does not touch dependencies on %s', (platform) => {
        const fileSystem = mockFileSystem();

        prepareNativeHelpers({ fileSystem, platform });

        expect(fileSystem.lstatSync).not.toHaveBeenCalled();
        expect(fileSystem.chmodSync).not.toHaveBeenCalled();
    });

    it('fails clearly when the helper is missing', () => {
        const fileSystem = mockFileSystem();

        expect(() => prepareNativeHelpers({ fileSystem, packageDirectory: PACKAGE_DIRECTORY, platform: 'darwin' }))
            .toThrow('Missing node-pty spawn helper');
        expect(fileSystem.chmodSync).not.toHaveBeenCalled();
    });

    it('refuses to chmod a symlink or another non-regular file', () => {
        const helper = path.join(PACKAGE_DIRECTORY, 'build/Release', 'spawn-helper');
        const fileSystem = mockFileSystem({ [helper]: { mode: 0o644, regular: false } });

        expect(() => prepareNativeHelpers({ fileSystem, packageDirectory: PACKAGE_DIRECTORY, platform: 'darwin' }))
            .toThrow('must be a regular file');
        expect(fileSystem.chmodSync).not.toHaveBeenCalled();
    });

    it('does not hide permission errors', () => {
        const fileSystem = mockFileSystem();
        fileSystem.lstatSync.mockImplementation(() => { throw Object.assign(new Error('Access denied'), { code: 'EACCES' }); });

        expect(() => prepareNativeHelpers({ fileSystem, packageDirectory: PACKAGE_DIRECTORY, platform: 'darwin' }))
            .toThrow('Access denied');
    });
});
