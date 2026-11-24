import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Web Audio 목으로 playCandleBlowOut 그래프 생성을 검증한다.
 */
describe('sound helpers', () => {
  const createGain = vi.fn()
  const createBiquadFilter = vi.fn()
  const createBuffer = vi.fn()
  const createBufferSource = vi.fn()
  const createOscillator = vi.fn()

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
    createOscillator.mockReset().mockImplementation(() => ({
      type: 'sine',
      frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    }))

    class FakeAudioContext {
      state = 'running'
      currentTime = 0
      sampleRate = 44100
      destination = {}
      resume = vi.fn(async () => undefined)
      suspend = vi.fn(async () => undefined)
      createGain = createGain
      createOscillator = createOscillator
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

  it('starts one two-tone drone and mutes or unmutes it immediately', async () => {
    const { unlockAudio, toggleMute } = await import('../sound')
    await unlockAudio()
    await unlockAudio()
    expect(createOscillator).toHaveBeenCalledTimes(2)
    expect(createOscillator.mock.results.map((r) => r.value.frequency.value)).toEqual([55, 82])
    const master = createGain.mock.results[0]!.value
    const drone = createGain.mock.results[1]!.value
    expect(drone.gain.value).toBe(0.035)
    toggleMute()
    expect(master.gain.value).toBe(0)
    toggleMute()
    expect(master.gain.value).toBe(1)
  })

  it('raises the truth resonance with each combo and creates a low timer pulse', async () => {
    const { unlockAudio, playTruthReveal, playTimerTick } = await import('../sound')
    await unlockAudio()
    createOscillator.mockClear()
    await playTruthReveal(1)
    await playTruthReveal(4)
    expect(createOscillator.mock.results[2]!.value.frequency.value)
      .toBeGreaterThan(createOscillator.mock.results[0]!.value.frequency.value)
    await playTimerTick()
    const pulse = createOscillator.mock.results[4]!.value
    expect(pulse.frequency.setValueAtTime).toHaveBeenCalledWith(130, 0)
    expect(pulse.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(55, 0.12)
  })
})
