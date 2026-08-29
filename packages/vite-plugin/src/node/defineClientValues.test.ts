import { describe, expect, it } from 'vitest'
import { defineClientValues } from './defineClientValues'
import type { ResolvedConfigWithHMRToken } from './types'

const clientTemplate = [
  'protocol=__HMR_PROTOCOL__',
  'host=__HMR_HOSTNAME__',
  'port=__HMR_PORT__',
  'timeout=__HMR_TIMEOUT__',
  'overlay=__HMR_ENABLE_OVERLAY__',
].join('\n')

function createConfig(server: Record<string, unknown>) {
  return {
    base: '/',
    define: {},
    mode: 'development',
    server: {
      middlewareMode: false,
      port: 5173,
      ...server,
    },
  } as unknown as ResolvedConfigWithHMRToken
}

describe('defineClientValues', () => {
  it('reads WebSocket settings from Vite 8 without touching deprecated HMR fields', () => {
    const hmr = { overlay: false }
    for (const key of [
      'clientPort',
      'host',
      'path',
      'port',
      'protocol',
      'timeout',
    ]) {
      Object.defineProperty(hmr, key, {
        get() {
          throw new Error(`deprecated HMR field ${key} was read`)
        },
      })
    }

    const result = defineClientValues(
      clientTemplate,
      createConfig({
        hmr,
        ws: {
          clientPort: 4321,
          host: 'ws-host',
          protocol: 'wss',
          timeout: 1234,
        },
      }),
    )

    expect(result).toBe(
      [
        'protocol="wss"',
        'host="ws-host"',
        'port="4321"',
        'timeout=1234',
        'overlay=false',
      ].join('\n'),
    )
  })

  it('does not fall back to deprecated HMR fields when WebSockets are disabled', () => {
    const hmr = { overlay: false }
    Object.defineProperty(hmr, 'host', {
      get() {
        throw new Error('deprecated HMR host was read')
      },
    })

    const result = defineClientValues(
      clientTemplate,
      createConfig({ hmr, ws: false }),
    )

    expect(result).toBe(
      [
        'protocol=null',
        'host=null',
        'port="5173"',
        'timeout=30000',
        'overlay=false',
      ].join('\n'),
    )
  })

  it('falls back to HMR settings before Vite 8', () => {
    const result = defineClientValues(
      clientTemplate,
      createConfig({
        hmr: {
          clientPort: 24679,
          host: 'legacy-host',
          overlay: false,
          protocol: 'ws',
          timeout: 5000,
        },
      }),
    )

    expect(result).toBe(
      [
        'protocol="ws"',
        'host="legacy-host"',
        'port="24679"',
        'timeout=5000',
        'overlay=false',
      ].join('\n'),
    )
  })
})
