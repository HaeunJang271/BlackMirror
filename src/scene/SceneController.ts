import * as THREE from 'three'
import type { BoardCard, BossId, RitualId } from '../types/game'
import { log } from '../utils/logger'
import { createBoss } from './createBoss'
import { createCandles } from './createCandles'
import { createCards } from './createCards'
import { createCeilingLamp } from './createCeilingLamp'
import { createScale } from './createScale'
import { createTable } from './createTable'
import { createRitualFx, type RitualFxCue } from './ritualFx'

export interface SceneSyncState {
  board: BoardCard[]
  candles: number
  bossId: BossId
  expectedDamage: number
  multiplier: number
  hit: boolean
  nod: boolean
  interactive: boolean
  saltActive: boolean
  bloodActive: boolean
  ritualCue: RitualFxCue | null
  saltBreak: boolean
}

interface CameraFraming {
  fov: number
  pos: THREE.Vector3
  look: THREE.Vector3
}

const DESKTOP: CameraFraming = {
  fov: 46,
  pos: new THREE.Vector3(0, 1.62, 2.45),
  look: new THREE.Vector3(0, 0.78, -0.55),
}

const MOBILE: CameraFraming = {
  fov: 62,
  pos: new THREE.Vector3(0, 1.95, 2.95),
  look: new THREE.Vector3(0, 0.55, -0.2),
}

/**
 * Three.js 1인칭 테이블 씬 컨트롤러.
 */
export class SceneController {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera

  private readonly boss = createBoss()
  private readonly candles = createCandles()
  private readonly cards = createCards()
  private readonly scale = createScale()
  private readonly ritualFx = createRitualFx()
  private readonly ceilingLamp = createCeilingLamp()
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly clock = new THREE.Clock()
  private parallax = { x: 0, y: 0 }
  private targetParallax = { x: 0, y: 0 }
  private framing: CameraFraming = DESKTOP
  private hoveredId: string | null = null
  private interactive = false
  private onCardClick: ((id: string) => void) | null = null
  private raf = 0
  private disposed = false
  private hitPulse = false
  private nodPulse = false
  private currentBossId: BossId | null = null
  private tintLights: THREE.Light[] = []
  private lastCandles = 3

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x050404, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x080606, 0.055)
    this.scene.background = new THREE.Color(0x080606)

    this.camera = new THREE.PerspectiveCamera(DESKTOP.fov, 1, 0.1, 40)
    this.camera.position.copy(DESKTOP.pos)
    this.camera.lookAt(DESKTOP.look)

    this.buildWorld()
    this.bindEvents(canvas)
    this.resize()
    this.loop()
    log('info', 'TableScene ready')
  }

  private buildWorld() {
    this.scene.add(createTable())
    this.scene.add(this.boss.group)
    this.scene.add(this.candles.group)
    this.scene.add(this.cards.group)
    this.scene.add(this.scale.group)
    this.scene.add(this.ritualFx.group)
    this.scene.add(this.ceilingLamp.group)

    const hemi = new THREE.HemisphereLight(0x4a4238, 0x080606, 0.55)
    const fill = new THREE.PointLight(0x3a3228, 0.45, 7)
    fill.position.set(0.8, 1.2, 1.2)
    const rim = new THREE.PointLight(0xc5a059, 0.75, 4.5, 1.8)
    rim.position.set(0.45, 1.35, -2.25)
    const rimFill = new THREE.PointLight(0x8a7040, 0.4, 3.8, 2)
    rimFill.position.set(-0.65, 1.1, -2.15)

    this.scene.add(hemi, fill, rim, rimFill)
    this.tintLights = [hemi, this.ceilingLamp.spot, fill, rim, rimFill]
  }

  private bindEvents(canvas: HTMLCanvasElement) {
    const onMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((clientY - rect.top) / rect.height) * 2 + 1
      this.pointer.set(nx, ny)
      this.targetParallax.x = nx * 0.04
      this.targetParallax.y = ny * 0.03
      this.pickHover()
    }
    canvas.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY))
    canvas.addEventListener('pointerdown', (e) => {
      onMove(e.clientX, e.clientY)
      if (!this.interactive || !this.onCardClick) return
      this.pickHover()
      if (this.hoveredId) this.onCardClick(this.hoveredId)
    })
    window.addEventListener('resize', this.resize)
  }

  private pickHover() {
    if (!this.interactive) {
      this.hoveredId = null
      return
    }
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.cards.getPickables(), false)
    this.hoveredId = (hits[0]?.object.userData.cardId as string) ?? null
  }

  private applyFraming(aspect: number) {
    const mobile = aspect < 0.75
    this.framing = mobile ? MOBILE : DESKTOP
    this.camera.fov = this.framing.fov
    this.camera.updateProjectionMatrix()
    this.cards.setMobileLayout(mobile)
  }

  private readonly resize = () => {
    const canvas = this.renderer.domElement
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    const aspect = w / h
    this.camera.aspect = aspect
    this.applyFraming(aspect)
    this.renderer.setSize(w, h, false)
  }

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, this.clock.getDelta())
    const t = this.clock.elapsedTime

    this.parallax.x = THREE.MathUtils.lerp(
      this.parallax.x,
      this.targetParallax.x,
      0.06,
    )
    this.parallax.y = THREE.MathUtils.lerp(
      this.parallax.y,
      this.targetParallax.y,
      0.06,
    )

    const shake = this.hitPulse ? Math.sin(t * 40) * 0.012 : 0
    const f = this.framing
    this.camera.position.set(
      f.pos.x + this.parallax.x + shake,
      f.pos.y + this.parallax.y * 0.35,
      f.pos.z,
    )
    this.camera.lookAt(
      f.look.x + this.parallax.x * 0.45,
      f.look.y + this.parallax.y * 0.25,
      f.look.z,
    )

    this.boss.update(t, { hit: this.hitPulse, nod: this.nodPulse })
    this.hitPulse = false
    this.nodPulse = false
    this.candles.update(t)
    this.ceilingLamp.update(t)
    this.cards.update(t, this.hoveredId)
    this.scale.update(t)
    this.ritualFx.update(dt, {
      clairvoyance: (id) => this.cards.playClairvoyance(id),
      forbidden: (id) => this.cards.playForbiddenFlash(id),
    })
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * 카드 클릭 콜백을 등록한다.
   */
  setCardClickHandler(handler: (cardId: string) => void) {
    this.onCardClick = handler
  }

  /**
   * HUD용 피의 서약 맥동 강도를 반환한다.
   */
  getBloodPulse(): number {
    return this.ritualFx.getBloodPulse()
  }

  /**
   * 게임 상태를 3D 씬에 반영한다.
   */
  sync(state: SceneSyncState) {
    this.interactive = state.interactive
    this.cards.syncBoard(state.board)

    // 재의 숨결: 촛불이 늘면 이미 setLitCount가 불을 켬
    if (state.candles > this.lastCandles) {
      log('info', 'ash breath relight', { candles: state.candles })
    }
    this.lastCandles = state.candles
    this.candles.setLitCount(state.candles)

    if (this.currentBossId !== state.bossId) {
      this.boss.setBoss(state.bossId)
      this.currentBossId = state.bossId
    }

    this.scale.setTilt(
      Math.min(
        0.45,
        (state.expectedDamage / 80) * 0.35 + (state.multiplier - 1) * 0.08,
      ),
    )

    this.ritualFx.setSaltActive(state.saltActive)
    if (state.saltBreak) this.ritualFx.breakSalt()
    this.ritualFx.setBloodTint(
      state.bloodActive,
      this.tintLights,
      this.scene.fog as THREE.FogExp2 | null,
    )
    if (state.ritualCue) this.ritualFx.trigger(state.ritualCue)

    if (state.hit) this.hitPulse = true
    if (state.nod) this.nodPulse = true
  }

  /**
   * WebGL 리소스를 정리한다.
   */
  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    this.renderer.dispose()
    log('info', 'TableScene disposed')
  }
}

export type { RitualId }
