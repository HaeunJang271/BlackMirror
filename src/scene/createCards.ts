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

  for (let i = 0; i < 5; i += 1) {
    const mats: THREE.Material[] = [edge, edge, edge, edge, backMat, backMat]
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.028), mats)
    mesh.castShadow = true
    // 눕힌 상태 고정 — 플립은 flipRoot.rotation.x 로만 처리
    // Z 180°: 앞면 문양·글자가 보스 쪽이 아닌 플레이어 쪽으로 똑바로
    mesh.rotation.set(-Math.PI / 2, 0, Math.PI)

    const flipRoot = new THREE.Group()
    flipRoot.add(mesh)

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
        }
        card.id = data.id
        card.mesh.userData.cardId = data.id
        applyFace(card, data.face)

        if (data.removed && !card.removed && !card.vanishing) {
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
    update(_t, hoveredId) {
      cards.forEach((card) => {
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
          const hover = hoveredId === card.id
          card.targetY = hover ? 0.1 : REST_Y
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
        .map((c) => c.mesh)
    },
  }
}
