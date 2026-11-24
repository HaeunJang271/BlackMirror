import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Web Audio 목으로 playCandleBlowOut 그래프 생성을 검증한다.
 */
describe('sound helpers', () => {
  const createGain = vi.fn()
  const createBiquadFilter = vi.fn()
  const createBuffer = vi.fn()
  const createBufferSource = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    createGain.mockReset().mockImplementation(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    }))
    createBiquadFilter.mockReset().mockImplementation(() => ({
      type: 'bandpass',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    }))
    createBuffer.mockReset().mockImplementation(
      (channels: number, length: number, rate: number) => {
        const data = new Float32Array(length)
        return {
          numberOfChannels: channels,
          length,
          sampleRate: rate,
          getChannelData: () => data,
        }
      },
    )
    createBufferSource.mockReset().mockImplementation(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }))

    class FakeAudioContext {
      state = 'running'
      currentTime = 0
      sampleRate = 44100
      destination = {}
      resume = vi.fn(async () => undefined)
      suspend = vi.fn(async () => undefined)
      createGain = createGain
      createOscillator = vi.fn()
      createBiquadFilter = createBiquadFilter
      createBuffer = createBuffer
      createBufferSource = createBufferSource
    }

    vi.stubGlobal('window', {
      AudioContext: FakeAudioContext,
      webkitAudioContext: FakeAudioContext,
    })
    vi.stubGlobal('AudioContext', FakeAudioContext)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('playCandleBlowOut creates blow + hiss noise graph', async () => {
    const { playCandleBlowOut } = await import('../sound')
    await playCandleBlowOut()
    expect(createBufferSource).toHaveBeenCalled()
    expect(createBiquadFilter).toHaveBeenCalled()
    expect(createBuffer).toHaveBeenCalled()
  })
})
