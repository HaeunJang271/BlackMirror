import * as THREE from 'three'
import type { BoardCard, CardFace } from '../types/game'
import { applyFlipPose, REST_Y, stepPeek } from './cardAnim'
import {
  createCardBackTexture,
  createCurseFaceTexture,
  createTruthFaceTexture,
} from './textures'

export interface CardMesh {
  id: string
  group: THREE.Group
  flipRoot: THREE.Group
  mesh: THREE.Mesh
  hitbox: THREE.Mesh
  highlight: THREE.Group
  highlightMaterial: THREE.MeshStandardMaterial
  basePos: THREE.Vector3
  targetY: number
  flipProgress: number
  revealed: boolean
  removed: boolean
  vanishing: boolean
  vanishT: number
  face: CardFace
  faceApplied: CardFace | null
  peekPhase: 'none' | 'open' | 'hold' | 'close'
  peekT: number
  peekRing: THREE.Group | null
  flashT: number
}

export interface CardsRig {
  group: THREE.Group
  cards: CardMesh[]
  /** 보드 상태로 메시를 동기화한다. */
  syncBoard: (board: BoardCard[]) => void
  /** 모바일 세로용으로 카드 간격·크기를 줄인다. */
  setMobileLayout: (mobile: boolean) => void
  /** 투시 링을 카드 위에 띄운다. */
  playClairvoyance: (cardId: string) => void
  /** 금단의 손 — 진실 카드 금빛 플래시. */
  playForbiddenFlash: (cardId: string) => void
  /** 호버/플립/소멸 애니메이션. */
  update: (t: number, hoveredId: string | null) => void
  /** Raycaster 대상 메시 목록. */
  getPickables: () => THREE.Object3D[]
}

const DESKTOP_FAN = [-0.7, -0.35, 0, 0.35, 0.7]
const MOBILE_FAN = [-0.58, -0.29, 0, 0.29, 0.58]
const DESKTOP_ROT = [0.06, 0.03, 0, -0.03, -0.06]
const MOBILE_ROT = [0.05, 0.025, 0, -0.025, -0.05]

/**
 * 테이블 위 부채꼴 3D 카드 5장을 생성한다.
 */
export function createCards(): CardsRig {
  const group = new THREE.Group()
  group.position.set(0, 0.1, -0.12)

  const backTex = createCardBackTexture()
  const truthTex = createTruthFaceTexture()
  const curseTex = createCurseFaceTexture()
  const edge = new THREE.MeshStandardMaterial({
    color: 0x1a1510,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
  const truthMat = new THREE.MeshStandardMaterial({
    map: truthTex,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
  const curseMat = new THREE.MeshStandardMaterial({
    map: curseTex,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })

  const cards: CardMesh[] = []
  const embers: { points: THREE.Points; velocities: Float32Array; started: number | null; updated: number | null }[] = []
  const longEdge = new THREE.BoxGeometry(0.3, 0.002, 0.006)
  const shortEdge = new THREE.BoxGeometry(0.006, 0.002, 0.42)

  for (let i = 0; i < 5; i += 1) {
    const mats: THREE.Material[] = [edge, edge, edge, edge, backMat, backMat]
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.028), mats)
    mesh.castShadow = true
    // 눕힌 상태 고정 — 플립은 flipRoot.rotation.x 로만 처리
    // Z 180°: 앞면 문양·글자가 보스 쪽이 아닌 플레이어 쪽으로 똑바로
    mesh.rotation.set(-Math.PI / 2, 0, Math.PI)

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.504, 0.034),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    )
    hitbox.rotation.copy(mesh.rotation)
    const flipRoot = new THREE.Group()
    flipRoot.add(mesh, hitbox)
    const highlight = new THREE.Group()
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a5b27, emissive: 0xe8a856, emissiveIntensity: 0,
    })
    for (const z of [-0.21, 0.21]) {
      const edgeMesh = new THREE.Mesh(longEdge, highlightMaterial)
      edgeMesh.position.z = z
      highlight.add(edgeMesh)
    }
    for (const x of [-0.15, 0.15]) {
      const edgeMesh = new THREE.Mesh(shortEdge, highlightMaterial)
      edgeMesh.position.x = x
      highlight.add(edgeMesh)
    }
    highlight.position.y = 0.016
    flipRoot.add(highlight)

    const cardGroup = new THREE.Group()
    const x = DESKTOP_FAN[i]!
    cardGroup.position.set(x, REST_Y, -Math.abs(x) * 0.04)
    cardGroup.rotation.y = DESKTOP_ROT[i]!
    cardGroup.add(flipRoot)
    group.add(cardGroup)

    cards.push({
      id: `slot-${i}`,
      group: cardGroup,
      flipRoot,
      mesh,
      hitbox,
      highlight,
      highlightMaterial,
      basePos: cardGroup.position.clone(),
      targetY: REST_Y,
      flipProgress: 0,
      revealed: false,
      removed: false,
      vanishing: false,
      vanishT: 0,
      face: 'truth',
      faceApplied: null,
      peekPhase: 'none',
      peekT: 0,
      peekRing: null,
      flashT: 0,
    })
  }

  function applyFace(card: CardMesh, face: CardFace) {
    if (card.faceApplied === face) return
    card.face = face
    card.faceApplied = face
    const mats = card.mesh.material as THREE.Material[]
    mats[4] = backMat
    mats[5] = face === 'truth' ? truthMat : curseMat
    card.mesh.material = mats
  }

  function makePeekRing(): THREE.Group {
    const g = new THREE.Group()
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 24),
      new THREE.MeshBasicMaterial({
        color: 0xc5a059,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.035, 16),
      new THREE.MeshBasicMaterial({
        color: 0xe8a856,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    )
    pupil.rotation.x = -Math.PI / 2
    pupil.position.y = 0.01
    g.add(ring, pupil)
    g.position.y = 0.12
    return g
  }

  function releaseEmbers(card: CardMesh) {
    const count = 32
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 0.26
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.36
      velocities[i * 3] = (Math.random() - 0.5) * 0.35
      velocities[i * 3 + 1] = 0.3 + Math.random() * 0.6
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.35
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0xe7461d, size: 0.035, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geometry, material)
    points.position.copy(card.group.position)
    group.add(points)
    embers.push({ points, velocities, started: null, updated: null })
  }

  return {
    group,
    cards,
    setMobileLayout(mobile: boolean) {
      const fan = mobile ? MOBILE_FAN : DESKTOP_FAN
      const rot = mobile ? MOBILE_ROT : DESKTOP_ROT
      group.scale.setScalar(mobile ? 0.82 : 1)
      cards.forEach((card, i) => {
        const x = fan[i]!
        card.basePos.set(x, REST_Y, -Math.abs(x) * 0.04)
        if (!card.vanishing && card.flipProgress === 0) {
          card.group.position.x = x
          card.group.position.z = card.basePos.z
          card.group.position.y = REST_Y
        } else {
          card.group.position.x = x
          card.group.position.z = card.basePos.z
        }
        card.group.rotation.y = rot[i]!
      })
    },
    syncBoard(board: BoardCard[]) {
      for (let i = 0; i < 5; i += 1) {
        const data = board[i]
        const card = cards[i]!
        if (!data) {
          card.group.visible = false
          continue
        }
        if (card.id !== data.id) {
          card.peekPhase = 'none'
          card.peekT = 0
          card.vanishing = false
          card.vanishT = 0
          card.removed = false
          card.group.rotation.z = 0
          card.group.scale.setScalar(1)
        }
        card.id = data.id
        card.mesh.userData.cardSurface = true
        card.mesh.userData.cardId = data.id
        card.hitbox.userData.cardId = data.id
        applyFace(card, data.face)

        if (data.removed && !card.removed && !card.vanishing) {
          releaseEmbers(card)
          card.vanishing = true
          card.vanishT = 0
          card.removed = true
        } else if (!data.removed && !card.vanishing) {
          card.removed = false
          card.group.visible = true
          card.group.scale.setScalar(1)
          card.group.rotation.z = 0
        }

        if (data.revealed && !card.revealed) {
          card.peekPhase = 'none'
          card.revealed = true
          card.flipProgress = 0.001
        } else if (!data.revealed && !card.vanishing && card.peekPhase === 'none') {
          card.revealed = false
          card.flipProgress = 0
          card.flipRoot.rotation.x = 0
          card.group.position.y = REST_Y
        } else if (card.revealed && card.flipProgress >= 1) {
          applyFlipPose(card, 1)
        }
      }
    },
    playClairvoyance(cardId: string) {
      const card = cards.find((c) => c.id === cardId)
      if (!card || card.revealed || card.removed) return
      card.peekPhase = 'open'
      card.peekT = 0
      if (card.peekRing) card.group.remove(card.peekRing)
      card.peekRing = makePeekRing()
      card.group.add(card.peekRing)
    },
    playForbiddenFlash(cardId: string) {
      const card = cards.find((c) => c.id === cardId)
      if (!card) return
      card.flashT = 0.6
    },
    update(t, hoveredId) {
      for (let i = embers.length - 1; i >= 0; i -= 1) {
        const ember = embers[i]!
        if (ember.started === null) ember.started = t
        const dt = ember.updated === null ? 0 : Math.min(0.05, Math.max(0, t - ember.updated))
        ember.updated = t
        const age = Math.max(0, t - ember.started)
        const positions = ember.points.geometry.getAttribute('position') as THREE.BufferAttribute
        for (let j = 0; j < positions.count; j += 1) {
          positions.setXYZ(j,
            positions.getX(j) + ember.velocities[j * 3]! * dt,
            positions.getY(j) + ember.velocities[j * 3 + 1]! * dt,
            positions.getZ(j) + ember.velocities[j * 3 + 2]! * dt,
          )
        }
        positions.needsUpdate = true
        ;(ember.points.material as THREE.PointsMaterial).opacity = Math.max(0, 0.95 * (1 - age / 0.9))
        if (age >= 0.9) {
          group.remove(ember.points)
          ember.points.geometry.dispose()
          ;(ember.points.material as THREE.PointsMaterial).dispose()
          embers.splice(i, 1)
        }
      }
      cards.forEach((card) => {
        const hovered = hoveredId === card.id && !card.revealed && !card.removed && card.peekPhase === 'none'
        card.highlight.visible = !card.revealed && !card.removed
        card.highlightMaterial.emissiveIntensity = THREE.MathUtils.lerp(
          card.highlightMaterial.emissiveIntensity, hovered ? 1.4 : 0, 0.2,
        )
        if (card.vanishing) {
          card.vanishT += 0.028
          const p = Math.min(1, card.vanishT)
          card.group.position.y = REST_Y + p * 0.6
          card.group.rotation.z = p * 0.9
          card.group.scale.setScalar(1 - p)
          if (p >= 1) {
            card.group.visible = false
            card.vanishing = false
            card.group.scale.setScalar(1)
            card.group.rotation.z = 0
          }
          return
        }

        if (!card.group.visible) return

        if (!card.revealed && card.peekPhase !== 'none') {
          stepPeek(card)
        } else if (card.revealed && card.flipProgress < 1) {
          card.flipProgress = Math.min(1, card.flipProgress + 0.045)
          applyFlipPose(card, card.flipProgress)
        } else if (!card.revealed) {
          card.targetY = hovered ? REST_Y + 0.04 : REST_Y
          card.group.position.y = THREE.MathUtils.lerp(
            card.group.position.y,
            card.targetY,
            0.18,
          )
          card.flipRoot.rotation.x = 0
        } else {
          applyFlipPose(card, 1)
        }

        if (card.peekRing) {
          card.peekRing.rotation.z += 0.04
          const mat = (card.peekRing.children[0] as THREE.Mesh)
            .material as THREE.MeshBasicMaterial
          mat.opacity = Math.max(0, mat.opacity - 0.02)
          if (mat.opacity <= 0.05) {
            card.group.remove(card.peekRing)
            card.peekRing = null
          }
        }

        if (card.flashT > 0) {
          card.flashT -= 0.016
          const pulse = 0.5 + Math.sin(card.flashT * 40) * 0.5
          card.mesh.scale.setScalar(1 + pulse * 0.06)
        } else {
          card.mesh.scale.setScalar(1)
        }
      })
    },
    getPickables() {
      return cards
        .filter(
          (c) => c.group.visible && !c.removed && !c.revealed && !c.vanishing,
        )
        .flatMap((c) => [c.mesh, c.hitbox])
    },
  }
}
