import { setAdAudioPaused } from './sound'
import { log } from './logger'

const REWARDED_AD_GROUP_ID = import.meta.env.VITE_TOSS_REWARDED_AD_ID || 'TEST_REWARDED_AD_GROUP_ID'
type AdSdk = typeof import('@apps-in-toss/web-framework')
type AdStatus = 'loading' | 'simulation' | 'showing'
type AdResult = 'rewarded' | 'dismissed' | 'failed' | 'cancelled'

let sdkPromise: Promise<AdSdk | null> | null = null
let loading: Promise<boolean> | null = null
let loaded = false
let showing = false

function getSdk(): Promise<AdSdk | null> {
  sdkPromise ??= import('@apps-in-toss/web-framework').catch((error: unknown) => {
    log('warn', 'rewarded ad SDK unavailable', error)
    return null
  })
  return sdkPromise
}

function supported(sdk: AdSdk | null): sdk is AdSdk {
  try {
    return Boolean(sdk?.loadFullScreenAd.isSupported?.() && sdk?.showFullScreenAd.isSupported?.())
  } catch {
    return false
  }
}

/** 광고는 loaded 이벤트가 발생한 뒤에만 표시할 수 있다. */
export async function preloadRewardedAd(): Promise<boolean> {
  const sdk = await getSdk()
  if (!supported(sdk)) return false
  if (loaded) return true
  if (loading) return loading
  loading = new Promise<boolean>((resolve) => {
    let done = false
    let unregister: (() => void) | undefined
    const timeout = setTimeout(() => finish(false), 15000)
    function finish(success: boolean) {
      if (done) return
      done = true
      clearTimeout(timeout)
      loaded = success
      unregister?.()
      resolve(success)
    }
    try {
      unregister = sdk.loadFullScreenAd({
        options: { adGroupId: REWARDED_AD_GROUP_ID },
        onEvent: (event) => { if (event.type === 'loaded') finish(true) },
        onError: (error) => { log('warn', 'rewarded ad load failed', error); finish(false) },
      })
      if (done) unregister()
    } catch (error) {
      log('warn', 'rewarded ad load failed', error)
      finish(false)
    }
  }).finally(() => { loading = null })
  return loading
}

/** 실제 광고는 보상 이벤트만 지급하고, 일반 웹에서는 테스트 보상을 지급한다. */
export async function showRewardedAd(options: {
  onReward: () => void
  onStatus: (status: AdStatus) => void
  signal?: AbortSignal
}): Promise<AdResult> {
  if (showing || options.signal?.aborted) return 'cancelled'
  showing = true
  try {
    options.onStatus('loading')
    const sdk = await getSdk()
    if (options.signal?.aborted) return 'cancelled'
    if (!supported(sdk)) {
      options.onStatus('simulation')
      setAdAudioPaused(true)
      return await new Promise<AdResult>((resolve) => {
        const timer = setTimeout(() => {
          options.signal?.removeEventListener('abort', cancel)
          options.onReward()
          resolve('rewarded')
        }, 1500)
        function cancel() { clearTimeout(timer); resolve('cancelled') }
        options.signal?.addEventListener('abort', cancel, { once: true })
      })
    }
    if (!await preloadRewardedAd()) return 'failed'
    if (options.signal?.aborted) return 'cancelled'
    loaded = false
    options.onStatus('showing')
    setAdAudioPaused(true)
    return await new Promise<AdResult>((resolve) => {
      let finished = false
      let rewarded = false
      let unregister: (() => void) | undefined
      const finish = (result: AdResult) => {
        if (finished) return
        finished = true
        options.signal?.removeEventListener('abort', cancel)
        unregister?.()
        resolve(result)
      }
      const cancel = () => finish('cancelled')
      options.signal?.addEventListener('abort', cancel, { once: true })
      try {
        unregister = sdk.showFullScreenAd({
          options: { adGroupId: REWARDED_AD_GROUP_ID },
          onEvent: (event) => {
            if (finished) return
            if (event.type === 'userEarnedReward' && !rewarded) {
              rewarded = true
              options.onReward()
            } else if (event.type === 'dismissed') {
              finish(rewarded ? 'rewarded' : 'dismissed')
            } else if (event.type === 'failedToShow') {
              finish(rewarded ? 'rewarded' : 'failed')
            }
          },
          onError: (error) => { log('warn', 'rewarded ad show failed', error); finish(rewarded ? 'rewarded' : 'failed') },
        })
        if (finished) unregister()
      } catch (error) {
        log('warn', 'rewarded ad show failed', error)
        finish(rewarded ? 'rewarded' : 'failed')
      }
    })
  } finally {
    setAdAudioPaused(false)
    showing = false
    if (!options.signal?.aborted) void preloadRewardedAd()
  }
}
