import { log } from './logger'

let ctx: AudioContext | null = null
let muted = false
let master: GainNode | null = null
let music: ReturnType<typeof createMusicEngine> | null = null
const curseShatter = typeof Audio === 'undefined' ? null : new Audio('/sfx/curse_shatter.m4a')
if (curseShatter) {
  curseShatter.preload = 'auto'
  curseShatter.volume = 0.7
  curseShatter.load()
}

const MUSIC_STEP = 60 / 50 / 2
const MUSIC_CHORDS = [
  { bass: [73.42, 110], notes: [146.83, 155.56, 146.83, 110, 155.56, 146.83, 174.61, 155.56] },
  { bass: [58.27, 87.31], notes: [155.56, 146.83, 155.56, 174.61, 146.83, 155.56, 110, 146.83] },
  { bass: [49, 73.42], notes: [110, 146.83, 155.56, 146.83, 174.61, 155.56, 146.83, 110] },
  { bass: [55, 82.41], notes: [146.83, 155.56, 174.61, 155.56, 146.83, 110, 155.56, 146.83] },
] as const

/** 네 마디 D 단조 루프. 8분음표 단위로 미리 예약해 타이머 지터를 줄인다. */
function createMusicEngine(audio: AudioContext, output: GainNode) {
  let interval: ReturnType<typeof setInterval> | null = null
  let bus: GainNode | null = null
  let delay: DelayNode | null = null
  let feedback: GainNode | null = null
  let nextTime = 0
  let nextStep = 0
  let resumeStep = 0
  let startTime = 0
  let startStep = 0
  const active = new Set<AudioScheduledSourceNode>()
  const noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.035), audio.sampleRate)
  const noise = noiseBuffer.getChannelData(0)
  for (let i = 0; i < noise.length; i += 1) noise[i] = Math.random() * 2 - 1

  function track(source: AudioScheduledSourceNode) {
    active.add(source)
    source.onended = () => { active.delete(source); source.disconnect() }
  }

  function pad(step: number, time: number) {
    const chord = MUSIC_CHORDS[Math.floor(step / 8) % 4]!
    const duration = (8 - step % 8) * MUSIC_STEP
    const filter = audio.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 240
    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.04, time + 0.3)
    gain.gain.setValueAtTime(0.04, time + Math.max(0.3, duration - 0.35))
    gain.gain.linearRampToValueAtTime(0, time + duration)
    filter.connect(gain)
    gain.connect(bus!)
    for (const frequency of chord.bass) {
      for (const [type, volume] of [['triangle', 0.44], ['sawtooth', 0.06]] as const) {
        const osc = audio.createOscillator()
        const voice = audio.createGain()
        osc.type = type
        osc.frequency.value = frequency
        voice.gain.value = volume
        osc.connect(voice)
        voice.connect(filter)
        track(osc)
        osc.start(time)
        osc.stop(time + duration + 0.02)
      }
    }
  }

  function lead(step: number, time: number) {
    const chord = MUSIC_CHORDS[Math.floor(step / 8) % 4]!
    const osc = audio.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = chord.notes[step % 8]!
    osc.detune.value = 3
    const filter = audio.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    const gain = envGain(audio, time, 0.035, 0.01, 0.9)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(bus!)
    gain.connect(delay!)
    track(osc)
    osc.start(time)
    osc.stop(time + 0.95)
  }

  function tick(time: number) {
    const source = audio.createBufferSource()
    source.buffer = noiseBuffer
    const filter = audio.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1200
    const gain = envGain(audio, time, 0.008, 0.002, 0.03)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(bus!)
    track(source)
    source.start(time)
    source.stop(time + 0.035)
  }

  function schedule() {
    if (!bus) return
    while (nextTime < audio.currentTime) {
      nextStep += 1
      nextTime += MUSIC_STEP
    }
    while (nextTime < audio.currentTime + 0.18) {
      if (nextStep % 8 === 0 || nextStep === startStep) pad(nextStep, nextTime)
      lead(nextStep, nextTime)
      if (nextStep % 2 === 0) tick(nextTime)
      nextStep += 1
      nextTime += MUSIC_STEP
    }
  }

  function start() {
    if (interval !== null || (typeof document !== 'undefined' && document.hidden)) return
    bus = audio.createGain()
    bus.gain.setValueAtTime(0, audio.currentTime)
    bus.gain.linearRampToValueAtTime(10, audio.currentTime + 2)
    bus.connect(output)
    delay = audio.createDelay()
    delay.delayTime.value = 0.28
    feedback = audio.createGain()
    feedback.gain.value = 0.25
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(bus)
    startTime = audio.currentTime + 0.05
    startStep = resumeStep
    nextStep = startStep
    nextTime = startTime
    schedule()
    interval = setInterval(schedule, 100)
  }

  function pause() {
    if (interval === null) return
    clearInterval(interval)
    interval = null
    resumeStep = startStep + Math.max(0, Math.floor((audio.currentTime - startTime) / MUSIC_STEP))
    for (const source of active) {
      try { source.stop() } catch { /* 이미 정지된 노드 */ }
      source.disconnect()
    }
    active.clear()
    feedback?.disconnect()
    delay?.disconnect()
    bus?.disconnect()
    feedback = null
    delay = null
    bus = null
  }

  return { start, pause }
}

function handleMusicVisibility() {
  if (typeof document === 'undefined') return
  if (document.hidden) music?.pause()
  else if (ctx && music) {
    const audio = ctx
    const engine = music
    if (audio.state === 'suspended') {
      void audio.resume().then(() => {
        if (!document.hidden && ctx === audio && music === engine) engine.start()
      }).catch((err) => log('warn', 'music resume failed', err))
    } else {
      engine.start()
    }
  }
}

function startDrone(audio: AudioContext): void {
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 180
  const gain = audio.createGain()
  gain.gain.value = 0.035
  filter.connect(gain)
  gain.connect(master!)
  for (const frequency of [55, 82]) {
    const osc = audio.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency
    osc.connect(filter)
    osc.start()
  }
}

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
      master = ctx.createGain()
      master.gain.value = muted ? 0 : 1
      master.connect(ctx.destination)
      startDrone(ctx)
      music = createMusicEngine(ctx, master)
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleMusicVisibility)
    }
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    if (!muted) music?.start()
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
  if (master) master.gain.value = muted ? 0 : 1
  if (muted) curseShatter?.pause()
  if (!muted && ctx?.state === 'suspended') void ctx.resume().catch((err) => log('warn', 'resume failed', err))
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
  g.connect(master!)
  osc.connect(og)
  og.connect(master!)
  noise.start(t)
  noise.stop(t + 0.045)
  osc.start(t)
  osc.stop(t + 0.06)
}

/**
 * 진실 적중 황동 차임. 콤보가 오를수록 음이 높아진다.
 */
export async function playTruthReveal(comboCount: number): Promise<void> {
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
  g.connect(master!)
  pg.connect(master!)
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
  g.connect(master!)
  cg.connect(master!)
  osc.start(t)
  click.start(t)
  osc.stop(t + 0.4)
  click.stop(t + 0.05)
  const impact = audio.createOscillator()
  impact.type = 'triangle'
  impact.frequency.setValueAtTime(160, t + 0.07)
  impact.frequency.exponentialRampToValueAtTime(65, t + 0.3)
  const impactGain = envGain(audio, t + 0.07, 0.16, 0.005, 0.3)
  impact.connect(impactGain)
  impactGain.connect(master!)
  impact.start(t + 0.07)
  impact.stop(t + 0.4)
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
  g.connect(master!)
  osc.start(t)
  osc.stop(t + 0.5)
}

/** 도자기가 깨지고 조각들이 흩어지는 소리. */
export async function playCurseShatter(): Promise<void> {
  if (isMuted() || !curseShatter) return
  try {
    curseShatter.currentTime = 0
    await curseShatter.play()
  } catch (err) {
    log('warn', 'curse shatter playback failed', err)
  }
}

/**
 * 타이머 마지막 4초: 낮은 심장 박동과 시계 소리.
 */
export async function playTimerTick(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  const osc = audio.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(130, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.12)
  const g = envGain(audio, t, 0.16, 0.002, 0.14)
  osc.connect(g)
  g.connect(master!)
  osc.start(t)
  osc.stop(t + 0.16)
}

/** 보스 처치 시 울리는 낮고 긴 종소리. */
export async function playBossDefeat(): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime
  for (const [frequency, volume] of [[82, 0.2], [164.8, 0.07], [247, 0.035]]) {
    const osc = audio.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency!
    const gain = envGain(audio, t, volume!, 0.01, 1.8)
    osc.connect(gain)
    gain.connect(master!)
    osc.start(t)
    osc.stop(t + 1.9)
  }
}

/**
 * 촛불 꺼짐 — 바람(후우) + 심지 치직 밴드패스 노이즈.
 */
export async function playCandleBlowOut(delaySeconds = 0): Promise<void> {
  const audio = await ensureCtx()
  if (!audio) return
  const t = audio.currentTime + Math.max(0, delaySeconds)

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
  blowGain.connect(master!)
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
  hissGain.connect(master!)
  hiss.start(t + 0.04)
  hiss.stop(t + 0.22)

  log('info', 'sfx candle blow out')
}
