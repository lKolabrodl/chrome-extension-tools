import { describe, expect, it } from 'vitest'
import { getChangedFilePath, getHmrHostConfig } from './plugin-hmr'

describe('getHmrHostConfig', () => {
  it('uses the Vite 8 WebSocket options without writing deprecated HMR fields', () => {
    const hmr = {}
    Object.defineProperty(hmr, 'host', {
      get() {
        throw new Error('deprecated HMR host was read')
      },
    })
    const server = { hmr, ws: { port: 24678 } }

    const result = getHmrHostConfig(server)

    expect(result).toEqual({ ws: { host: 'localhost', port: 24678 } })
  })

  it('falls back to the legacy HMR options before Vite 8', () => {
    const result = getHmrHostConfig({})

    expect(result).toEqual({ hmr: { host: 'localhost' } })
  })

  it('preserves disabled HMR and WebSocket settings', () => {
    expect(getHmrHostConfig({ hmr: false })).toBeUndefined()
    expect(getHmrHostConfig({ ws: false })).toBeUndefined()
  })
})

describe('getChangedFilePath', () => {
  it('normalizes Windows file paths to content script ids', () => {
    const root = String.raw`D:\a\chrome-extension-tools\chrome-extension-tools\packages\vite-plugin\tests\e2e\mv3-dynamic-script-iife`
    const file = String.raw`D:\a\chrome-extension-tools\chrome-extension-tools\packages\vite-plugin\tests\e2e\mv3-dynamic-script-iife\src\main-world.ts`

    expect(getChangedFilePath(root, file)).toBe('/src/main-world.ts')
  })

  it('normalizes POSIX file paths to content script ids', () => {
    const root =
      '/home/runner/work/chrome-extension-tools/chrome-extension-tools/packages/vite-plugin/tests/e2e/mv3-dynamic-script-iife'
    const file = `${root}/src/main-world.ts`

    expect(getChangedFilePath(root, file)).toBe('/src/main-world.ts')
  })

  it('returns null for files outside the root', () => {
    expect(
      getChangedFilePath('/repo/project', '/repo/other/src/main-world.ts'),
    ).toBe(null)
    expect(
      getChangedFilePath(
        '/repo/project',
        '/repo/project-other/src/main-world.ts',
      ),
    ).toBe(null)
  })
})
