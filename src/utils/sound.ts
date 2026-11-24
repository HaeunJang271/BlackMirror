import { log } from './logger'

let ctx: AudioContext | null = null
let muted = false

/**
 * AudioContext를 지연 생성하고, 브라우저 정책에 맞게 resume한다.
 */
async function ensureCtx(): Promise<AudioContext | null> {
  if (muted || typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      ctx = new Ctx()
    }
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx
  } catch (err) {
    log('warn', 'AudioContext init failed', err)
    return null
  }
}

function envGain(
  audio: AudioContext,
  start: number,
  peak: number,
  attack: number,
  release: number,
): GainNode {
  const g = audio.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + release)
  return g
}

/**
 * 음소거 여부를 토글하고 현재 상태를 반환한다.
 */
export function toggleMute(): boolean {
  muted = !muted
  if (muted && ctx) {
    void ctx.suspend().catch((err) => log('warn', 'suspend failed', err))
  }
  return muted
}

/**
 * 현재 음소거 상태.
 */
export function isMuted(): boolean {
  return muted
}

/**
 * 사용자 제스처에서 AudioContext를 깨운다.
 */
export async function unlockAudio(): Promise<void> {
  await ensureCtx()
}

/**
 * 패 플립 — 짧은 종이/돌 스침.
 */
export async function playCardFlip(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  const osc = audio.createOscillator()
  const noise = audio.createBufferSource()
  const buffer = audio.createBuffer(1, audio.sampleRate * 0.04, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  }
  noise.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800
  filter.Q.value = 0.8
  const g = envGain(audio, t, 0.12, 0.005, 0.05)
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(420, t)
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.05)
  const og = envGain(audio, t, 0.04, 0.004, 0.04)
  noise.connect(filter)
  filter.connect(g)
  g.connect(audio.destination)
  osc.connect(og)
  og.connect(audio.destination)
  noise.start(t)
  noise.stop(t + 0.045)
  osc.start(t)
  osc.stop(t + 0.06)
}

/**
 * 진실 적중 황동 차임. 콤보가 오를수록 음이 높아진다.
 */
export async function playTruthChime(comboCount: number): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  const base = 440 + Math.min(4, Math.max(1, comboCount)) * 90
  const osc = audio.createOscillator()
  const partial = audio.createOscillator()
  osc.type = 'sine'
  partial.type = 'triangle'
  osc.frequency.value = base
  partial.frequency.value = base * 2.01
  const g = envGain(audio, t, 0.14, 0.01, 0.28)
  const pg = envGain(audio, t, 0.05, 0.01, 0.2)
  osc.connect(g)
  partial.connect(pg)
  g.connect(audio.destination)
  pg.connect(audio.destination)
  osc.start(t)
  partial.start(t)
  osc.stop(t + 0.35)
  partial.stop(t + 0.28)
}

/**
 * 정산 — 묵직한 저울 타격음.
 */
export async function playCashOut(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  const osc = audio.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(90, t)
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.25)
  const g = envGain(audio, t, 0.28, 0.008, 0.35)
  const click = audio.createOscillator()
  click.type = 'square'
  click.frequency.value = 220
  const cg = envGain(audio, t, 0.08, 0.002, 0.04)
  osc.connect(g)
  click.connect(cg)
  g.connect(audio.destination)
  cg.connect(audio.destination)
  osc.start(t)
  click.start(t)
  osc.stop(t + 0.4)
  click.stop(t + 0.05)
}

/**
 * 저주/시간초과 — 낮은 저음.
 */
export async function playCurseHit(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  const osc = audio.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(70, t)
  osc.frequency.exponentialRampToValueAtTime(36, t + 0.4)
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 280
  const g = envGain(audio, t, 0.22, 0.02, 0.45)
  osc.connect(filter)
  filter.connect(g)
  g.connect(audio.destination)
  osc.start(t)
  osc.stop(t + 0.5)
}

/**
 * 타이머 3초 이하 째깍.
 */
export async function playTick(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  const osc = audio.createOscillator()
  osc.type = 'square'
  osc.frequency.value = 880
  const g = envGain(audio, t, 0.06, 0.001, 0.03)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start(t)
  osc.stop(t + 0.04)
}

/**
 * 촛불 꺼짐 — 바람(후우) + 심지 치직 밴드패스 노이즈.
 */
export async function playCandleBlowOut(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime

  // 바람 불어 끄는 소리 (저역 노이즈 후우)
  const blowBuf = audio.createBuffer(
    1,
    Math.floor(audio.sampleRate * 0.35),
    audio.sampleRate,
  )
  const blowData = blowBuf.getChannelData(0)
  for (let i = 0; i < blowData.length; i += 1) {
    const env = Math.sin((i / blowData.length) * Math.PI)
    blowData[i] = (Math.random() * 2 - 1) * env
  }
  const blow = audio.createBufferSource()
  blow.buffer = blowBuf
  const blowFilter = audio.createBiquadFilter()
  blowFilter.type = 'bandpass'
  blowFilter.frequency.value = 420
  blowFilter.Q.value = 0.55
  const blowGain = envGain(audio, t, 0.16, 0.02, 0.28)
  blow.connect(blowFilter)
  blowFilter.connect(blowGain)
  blowGain.connect(audio.destination)
  blow.start(t)
  blow.stop(t + 0.35)

  // 심지 치직 (고역 짧은 노이즈)
  const hissBuf = audio.createBuffer(
    1,
    Math.floor(audio.sampleRate * 0.18),
    audio.sampleRate,
  )
  const hissData = hissBuf.getChannelData(0)
  for (let i = 0; i < hissData.length; i += 1) {
    const fade = 1 - i / hissData.length
    hissData[i] = (Math.random() * 2 - 1) * fade * fade
  }
  const hiss = audio.createBufferSource()
  hiss.buffer = hissBuf
  const hissFilter = audio.createBiquadFilter()
  hissFilter.type = 'bandpass'
  hissFilter.frequency.value = 3200
  hissFilter.Q.value = 1.4
  const hissGain = envGain(audio, t + 0.04, 0.1, 0.005, 0.14)
  hiss.connect(hissFilter)
  hissFilter.connect(hissGain)
  hissGain.connect(audio.destination)
  hiss.start(t + 0.04)
  hiss.stop(t + 0.22)

  log('info', 'sfx candle blow out')
}
