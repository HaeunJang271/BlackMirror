import * as THREE from 'three'
import type { BoardCard, CardFace } from '../types/game'
import {
  createCardBackTexture,
  createCurseFaceTexture,
  createTruthFaceTexture,
} from './textures'

export interface CardMesh {
  id: string
  group: THREE.Group
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
  peekRing: THREE.Group | null
  flashT: number
}

export interface CardsRig {
  group: THREE.Group
  cards: CardMesh[]
  /**
   * 보드 상태로 메시를 동기화한다.
   */
  syncBoard: (board: BoardCard[]) => void
  /**
   * 모바일 세로용으로 카드 간격·크기를 줄인다.
   */
  setMobileLayout: (mobile: boolean) => void
  /**
   * 투시 링을 카드 위에 띄운다.
   */
  playClairvoyance: (cardId: string) => void
  /**
   * 금단의 손 — 진실 카드 금빛 플래시.
   */
  playForbiddenFlash: (cardId: string) => void
  /**
   * 호버/플립/소멸 애니메이션.
   */
  update: (t: number, hoveredId: string | null) => void
  /**
   * Raycaster 대상 메시 목록.
   */
  getPickables: () => THREE.Object3D[]
}

// 카드 폭(~0.30)보다 넓은 간격으로 테두리가 겹치지 않게 배치
const DESKTOP_FAN = [-0.7, -0.35, 0, 0.35, 0.7]
const MOBILE_FAN = [-0.58, -0.29, 0, 0.29, 0.58]
const DESKTOP_ROT = [0.06, 0.03, 0, -0.03, -0.06]
const MOBILE_ROT = [0.05, 0.025, 0, -0.025, -0.05]

/**
 * 테이블 위 부채꼴 3D 카드 5장을 생성한다.
 */
export function createCards(): CardsRig {
  const group = new THREE.Group()
  group.position.set(0, 0.09, -0.12)

  const backTex = createCardBackTexture()
  const truthTex = createTruthFaceTexture()
  const curseTex = createCurseFaceTexture()
  const edge = new THREE.MeshStandardMaterial({ color: 0x1a1510 })
  const backMat = new THREE.MeshStandardMaterial({ map: backTex })
  const truthMat = new THREE.MeshStandardMaterial({ map: truthTex })
  const curseMat = new THREE.MeshStandardMaterial({ map: curseTex })

  const cards: CardMesh[] = []

  for (let i = 0; i < 5; i += 1) {
    const mats: THREE.Material[] = [edge, edge, edge, edge, backMat, backMat]
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.03), mats)
    mesh.castShadow = true
    const cardGroup = new THREE.Group()
    const x = DESKTOP_FAN[i]!
    cardGroup.position.set(x, 0, -Math.abs(x) * 0.04)
    cardGroup.rotation.y = DESKTOP_ROT[i]!
    cardGroup.add(mesh)
    mesh.rotation.x = -Math.PI / 2
    group.add(cardGroup)

    cards.push({
      id: `slot-${i}`,
      group: cardGroup,
      mesh,
      basePos: cardGroup.position.clone(),
      targetY: 0,
      flipProgress: 0,
      revealed: false,
      removed: false,
      vanishing: false,
      vanishT: 0,
      face: 'truth',
      faceApplied: null,
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
      }),
    )
    pupil.rotation.x = -Math.PI / 2
    pupil.position.y = 0.01
    g.add(ring, pupil)
    g.position.y = 0.18
    return g
  }

  return {
    group,
    cards,
    setMobileLayout(mobile: boolean) {
      const fan = mobile ? MOBILE_FAN : DESKTOP_FAN
      const rot = mobile ? MOBILE_ROT : DESKTOP_ROT
      const scale = mobile ? 0.82 : 1
      group.scale.setScalar(scale)
      cards.forEach((card, i) => {
        const x = fan[i]!
        card.basePos.set(x, 0, -Math.abs(x) * 0.04)
        if (!card.vanishing) {
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
        card.id = data.id
        card.mesh.userData.cardId = data.id
        applyFace(card, data.face)

        if (data.removed && !card.removed && !card.vanishing) {
          card.vanishing = true
          card.vanishT = 0
          card.removed = true
        } else if (!data.removed) {
          card.removed = false
          card.vanishing = false
          card.group.visible = true
          card.group.scale.setScalar(1)
        }

        if (data.revealed && !card.revealed) {
          card.revealed = true
          card.flipProgress = 0.001
        } else if (!data.revealed && !card.vanishing) {
          card.revealed = false
          card.flipProgress = 0
          card.mesh.rotation.x = -Math.PI / 2
        } else if (card.revealed && card.flipProgress >= 1) {
          card.mesh.rotation.x = -Math.PI / 2 + Math.PI
        }
      }
    },
    playClairvoyance(cardId: string) {
      const card = cards.find((c) => c.id === cardId)
      if (!card) return
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
          card.group.position.y = p * 0.55
          card.group.rotation.y += 0.12
          card.group.rotation.z = p * 0.8
          card.group.scale.setScalar(1 - p)
          if (p >= 1) {
            card.group.visible = false
            card.vanishing = false
          }
          return
        }

        if (!card.group.visible) return
        const hover = hoveredId === card.id
        card.targetY = hover && !card.revealed ? 0.08 : 0
        card.group.position.y = THREE.MathUtils.lerp(
          card.group.position.y,
          card.targetY,
          0.15,
        )

        if (card.revealed && card.flipProgress < 1) {
          card.flipProgress = Math.min(1, card.flipProgress + 0.06)
          card.mesh.rotation.x = -Math.PI / 2 + Math.PI * card.flipProgress
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
