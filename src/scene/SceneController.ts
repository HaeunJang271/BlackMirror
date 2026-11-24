import * as THREE from 'three'
import type { BoardCard, BossId } from '../types/game'
import { log } from '../utils/logger'
import { createBoss } from './createBoss'
import { createCandles } from './createCandles'
import { createCards } from './createCards'
import { createScale } from './createScale'
import { createTable } from './createTable'

export interface SceneSyncState {
  board: BoardCard[]
  candles: number
  bossId: BossId
  expectedDamage: number
  multiplier: number
  hit: boolean
  nod: boolean
  interactive: boolean
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
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly clock = new THREE.Clock()
  private parallax = { x: 0, y: 0 }
  private targetParallax = { x: 0, y: 0 }
  private hoveredId: string | null = null
  private interactive = false
  private onCardClick: ((id: string) => void) | null = null
  private raf = 0
  private disposed = false
  private hitPulse = false
  private nodPulse = false
  private currentBossId: BossId | null = null

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
    this.scene.fog = new THREE.FogExp2(0x050404, 0.085)
    this.scene.background = new THREE.Color(0x050404)

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40)
    this.camera.position.set(0, 1.35, 1.85)
    this.camera.lookAt(0, 0.55, -0.4)

    this.buildWorld()
    this.bindEvents(canvas)
    this.resize()
    this.loop()
    log('info', 'TableScene ready')
  }

  private buildWorld() {
    const table = createTable()
    this.scene.add(table)
    this.scene.add(this.boss.group)
    this.scene.add(this.candles.group)
    this.scene.add(this.cards.group)
    this.scene.add(this.scale.group)

    const hemi = new THREE.HemisphereLight(0x3a342c, 0x050404, 0.35)
    this.scene.add(hemi)

    const spot = new THREE.SpotLight(0xb8c4d0, 1.1, 12, Math.PI / 5, 0.55, 1.2)
    spot.position.set(0, 3.2, 0.8)
    spot.target.position.set(0, 0, -0.2)
    this.scene.add(spot)
    this.scene.add(spot.target)

    const fill = new THREE.PointLight(0x2a2218, 0.25, 6)
    fill.position.set(0.8, 1.2, 1.2)
    this.scene.add(fill)
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
    const id = hits[0]?.object.userData.cardId as string | undefined
    this.hoveredId = id ?? null
  }

  private readonly resize = () => {
    const canvas = this.renderer.domElement
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const t = this.clock.getElapsedTime()

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
    this.camera.position.set(
      0 + this.parallax.x + shake,
      1.35 + this.parallax.y * 0.4,
      1.85,
    )
    this.camera.lookAt(this.parallax.x * 0.5, 0.55 + this.parallax.y, -0.4)

    this.boss.update(t, { hit: this.hitPulse, nod: this.nodPulse })
    this.hitPulse = false
    this.nodPulse = false
    this.candles.update(t)
    this.cards.update(t, this.hoveredId)
    this.scale.update(t)
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * 카드 클릭 콜백을 등록한다.
   */
  setCardClickHandler(handler: (cardId: string) => void) {
    this.onCardClick = handler
  }

  /**
   * 게임 상태를 3D 씬에 반영한다.
   */
  sync(state: SceneSyncState) {
    this.interactive = state.interactive
    this.cards.syncBoard(state.board)
    this.candles.setLitCount(state.candles)
    if (this.currentBossId !== state.bossId) {
      this.boss.setBoss(state.bossId)
      this.currentBossId = state.bossId
    }
    const tilt = Math.min(
      0.45,
      (state.expectedDamage / 80) * 0.35 + (state.multiplier - 1) * 0.08,
    )
    this.scale.setTilt(tilt)
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
