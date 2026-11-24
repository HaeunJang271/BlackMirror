import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({
  supported: false,
  showEvent: null as null | ((event: { type: string }) => void),
  load: vi.fn(),
  show: vi.fn(),
  pause: vi.fn(),
}))

vi.mock('@apps-in-toss/web-framework', () => ({
  loadFullScreenAd: Object.assign(mock.load, { isSupported: () => mock.supported }),
  showFullScreenAd: Object.assign(mock.show, { isSupported: () => mock.supported }),
}))
vi.mock('../sound', () => ({ setAdAudioPaused: mock.pause }))

describe('보상형 광고', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    mock.supported = false
    mock.showEvent = null
    mock.pause.mockReset()
    mock.load.mockReset().mockImplementation((params: { onEvent: (event: { type: string }) => void }) => {
      params.onEvent({ type: 'loaded' })
      return vi.fn()
    })
    mock.show.mockReset().mockImplementation((params: { onEvent: (event: { type: string }) => void }) => {
      mock.showEvent = params.onEvent
      return vi.fn()
    })
  })

  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers() })

  it('일반 웹에서는 1.5초 시뮬레이션 후에만 보상한다', async () => {
    const { showRewardedAd } = await import('../rewardedAd')
    const reward = vi.fn()
    const status = vi.fn()
    const result = showRewardedAd({ onReward: reward, onStatus: status })
    await vi.advanceTimersByTimeAsync(1)
    expect(status).toHaveBeenCalledWith('simulation')
    expect(reward).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1500)
    expect(await result).toBe('rewarded')
    expect(reward).toHaveBeenCalledOnce()
    expect(mock.pause.mock.calls).toEqual([[true], [false]])
  })

  it('실제 광고는 보상 이벤트를 한 번만 처리하고 닫힐 때 소리를 복원한다', async () => {
    mock.supported = true
    const { preloadRewardedAd, showRewardedAd } = await import('../rewardedAd')
    expect(await preloadRewardedAd()).toBe(true)
    const reward = vi.fn()
    const result = showRewardedAd({ onReward: reward, onStatus: vi.fn() })
    await vi.advanceTimersByTimeAsync(1)
    expect(mock.show).toHaveBeenCalledOnce()
    mock.showEvent!({ type: 'userEarnedReward' })
    mock.showEvent!({ type: 'userEarnedReward' })
    expect(reward).toHaveBeenCalledOnce()
    expect(mock.pause).toHaveBeenCalledWith(true)
    expect(mock.pause).not.toHaveBeenCalledWith(false)
    mock.showEvent!({ type: 'dismissed' })
    expect(await result).toBe('rewarded')
    expect(mock.pause).toHaveBeenCalledWith(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(mock.load).toHaveBeenCalledTimes(2)
  })

  it.each(['dismissed', 'failedToShow'])('%s에서는 보상을 주지 않는다', async (event) => {
    mock.supported = true
    const { showRewardedAd } = await import('../rewardedAd')
    const reward = vi.fn()
    const result = showRewardedAd({ onReward: reward, onStatus: vi.fn() })
    await vi.advanceTimersByTimeAsync(1)
    mock.showEvent!({ type: event })
    expect(await result).toBe(event === 'dismissed' ? 'dismissed' : 'failed')
    expect(reward).not.toHaveBeenCalled()
    expect(mock.pause).toHaveBeenCalledWith(false)
  })

  it('토스 환경에서 광고 로드가 실패하면 웹 보상으로 우회하지 않는다', async () => {
    mock.supported = true
    mock.load.mockImplementation((params: { onError: (error: unknown) => void }) => {
      params.onError(new Error('load failed'))
      return vi.fn()
    })
    const { showRewardedAd } = await import('../rewardedAd')
    const reward = vi.fn()
    const status = vi.fn()
    expect(await showRewardedAd({ onReward: reward, onStatus: status })).toBe('failed')
    expect(reward).not.toHaveBeenCalled()
    expect(status).not.toHaveBeenCalledWith('simulation')
    expect(mock.show).not.toHaveBeenCalled()
  })

  it('시뮬레이션 도중 취소하면 보상하지 않는다', async () => {
    const { showRewardedAd } = await import('../rewardedAd')
    const controller = new AbortController()
    const reward = vi.fn()
    const result = showRewardedAd({ onReward: reward, onStatus: vi.fn(), signal: controller.signal })
    await vi.advanceTimersByTimeAsync(1)
    controller.abort()
    expect(await result).toBe('cancelled')
    expect(reward).not.toHaveBeenCalled()
    expect(mock.pause).toHaveBeenCalledWith(false)
  })
})
