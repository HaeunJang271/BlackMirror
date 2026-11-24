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
  const createDelay = vi.fn()
  let visibilityHandler: (() => void) | undefined
  let fakeDocument: { hidden: boolean; addEventListener: ReturnType<typeof vi.fn> }
  let audioClock: { currentTime: number }
  let shatterAudio: { src: string; preload: string; volume: number; currentTime: number; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; load: ReturnType<typeof vi.fn> }
  let defeatAudio: typeof shatterAudio

  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    visibilityHandler = undefined
    fakeDocument = {
      hidden: false,
      addEventListener: vi.fn((name: string, handler: () => void) => {
        if (name === 'visibilitychange') visibilityHandler = handler
      }),
    }
    vi.stubGlobal('document', fakeDocument)
    createGain.mockReset().mockImplementation(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }))
    createBiquadFilter.mockReset().mockImplementation(() => ({
      type: 'bandpass',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
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
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }))
    createOscillator.mockReset().mockImplementation(() => ({
      type: 'sine',
      frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      detune: { value: 0 },
      connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    }))
    createDelay.mockReset().mockImplementation(() => ({
      delayTime: { value: 0 }, connect: vi.fn(), disconnect: vi.fn(),
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
      createDelay = createDelay
      constructor() { audioClock = this }
    }

    class FakeAudio {
      src: string
      preload = ''
      volume = 1
      currentTime = 0
      play = vi.fn(async () => undefined)
      pause = vi.fn()
      load = vi.fn()
      constructor(src: string) {
        this.src = src
        if (src.includes('curse_shatter')) shatterAudio = this
        else defeatAudio = this
      }
    }

    vi.stubGlobal('window', {
      AudioContext: FakeAudioContext,
      webkitAudioContext: FakeAudioContext,
    })
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('Audio', FakeAudio)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
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
    expect(createOscillator.mock.results.slice(0, 2).map((r) => r.value.frequency.value)).toEqual([55, 82])
    expect(createDelay).toHaveBeenCalledTimes(1)
    const master = createGain.mock.results[0]!.value
    const drone = createGain.mock.results[1]!.value
    expect(drone.gain.value).toBe(0.035)
    toggleMute()
    expect(master.gain.value).toBe(0)
    toggleMute()
    expect(master.gain.value).toBe(1)
  })

  it('광고가 끝나도 기존 음소거 상태를 유지한다', async () => {
    const { unlockAudio, toggleMute, setAdAudioPaused } = await import('../sound')
    await unlockAudio()
    const master = createGain.mock.results[0]!.value
    setAdAudioPaused(true)
    expect(master.gain.value).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    toggleMute()
    setAdAudioPaused(false)
    expect(master.gain.value).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('한 번만 재생을 시작하고 숨겨지면 중지, 돌아오면 재개한다', async () => {
    const { unlockAudio } = await import('../sound')
    await unlockAudio()
    await unlockAudio()
    expect(vi.getTimerCount()).toBe(1)
    expect(createDelay.mock.results[0]!.value.delayTime.value).toBe(0.28)
    fakeDocument.hidden = true
    visibilityHandler!()
    expect(vi.getTimerCount()).toBe(0)
    expect(createDelay.mock.results[0]!.value.disconnect).toHaveBeenCalled()
    fakeDocument.hidden = false
    visibilityHandler!()
    expect(vi.getTimerCount()).toBe(1)
    expect(createDelay).toHaveBeenCalledTimes(2)
  })

  it('8분음표를 예약하고 한 마디 뒤 다음 코드로 진행한다', async () => {
    const { unlockAudio } = await import('../sound')
    await unlockAudio()
    const initialFrequencies = createOscillator.mock.results.map((r) => r.value.frequency.value)
    expect(initialFrequencies).toContain(73.42)
    expect(initialFrequencies).toContain(110)
    expect(initialFrequencies).toContain(146.83)
    expect(createBiquadFilter.mock.results.some((r) => r.value.type === 'lowpass' && r.value.frequency.value === 900)).toBe(true)
    for (let i = 1; i <= 49; i += 1) {
      audioClock.currentTime = i / 10
      vi.advanceTimersByTime(100)
    }
    const frequencies = createOscillator.mock.results.map((r) => r.value.frequency.value)
    expect(frequencies).toContain(58.27)
    expect(frequencies).toContain(87.31)
    expect(frequencies).toContain(155.56)
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

  it('저주 효과음 파일을 미리 불러와 처음부터 재생하고 음소거를 따른다', async () => {
    const { unlockAudio, playCurseShatter, playCandleBlowOut, toggleMute } = await import('../sound')
    await unlockAudio()
    createOscillator.mockClear()
    createBiquadFilter.mockClear()
    createBufferSource.mockClear()
    await playCurseShatter()
    expect(shatterAudio.src).toBe('/sfx/curse_shatter.m4a')
    expect(shatterAudio.preload).toBe('auto')
    expect(shatterAudio.volume).toBe(0.7)
    expect(shatterAudio.load).toHaveBeenCalledOnce()
    expect(shatterAudio.play).toHaveBeenCalledOnce()
    shatterAudio.currentTime = 2
    await playCurseShatter()
    expect(shatterAudio.currentTime).toBe(0)
    expect(shatterAudio.play).toHaveBeenCalledTimes(2)
    createBufferSource.mockClear()
    await playCandleBlowOut(0.25)
    expect(createBufferSource.mock.results[0]!.value.start).toHaveBeenCalledWith(0.25)
    toggleMute()
    createOscillator.mockClear()
    await playCurseShatter()
    expect(shatterAudio.pause).toHaveBeenCalledOnce()
    expect(shatterAudio.play).toHaveBeenCalledTimes(2)
  })

  it('보스 처치 시 파일을 처음부터 재생하고 음소거 및 광고 일시정지를 따른다', async () => {
    const { playBossDefeat, toggleMute, setAdAudioPaused } = await import('../sound')
    expect(defeatAudio.src).toBe('/sfx/stage_clear_mysterious.mp3')
    expect(defeatAudio.preload).toBe('auto')
    defeatAudio.currentTime = 4
    await playBossDefeat()
    expect(defeatAudio.currentTime).toBe(0)
    expect(defeatAudio.play).toHaveBeenCalledOnce()
    toggleMute()
    expect(defeatAudio.pause).toHaveBeenCalledOnce()
    await playBossDefeat()
    expect(defeatAudio.play).toHaveBeenCalledOnce()
    toggleMute()
    setAdAudioPaused(true)
    await playBossDefeat()
    expect(defeatAudio.play).toHaveBeenCalledOnce()
  })
})
