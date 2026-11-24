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
  targetY: number
  flipProgress: number
  revealed: boolean
  removed: boolean
  face: CardFace
  faceApplied: CardFace | null
}

export interface CardsRig {
  group: THREE.Group
  cards: CardMesh[]
  /**
   * 보드 상태로 메시를 동기화한다.
   */
  syncBoard: (board: BoardCard[]) => void
  /**
   * 호버/플립 애니메이션.
   */
  update: (t: number, hoveredId: string | null) => void
  /**
   * Raycaster 대상 메시 목록.
   */
  getPickables: () => THREE.Object3D[]
}

/**
 * 테이블 위 부채꼴 3D 카드 5장을 생성한다.
 */
export function createCards(): CardsRig {
  const group = new THREE.Group()
  // 테이블 중앙 쪽 — 화면 세로 45~68% 밴드에 오도록
  group.position.set(0, 0.09, -0.12)

  const backTex = createCardBackTexture()
  const truthTex = createTruthFaceTexture()
  const curseTex = createCurseFaceTexture()
  const edge = new THREE.MeshStandardMaterial({ color: 0x1a1510 })
  const backMat = new THREE.MeshStandardMaterial({ map: backTex })
  const truthMat = new THREE.MeshStandardMaterial({ map: truthTex })
  const curseMat = new THREE.MeshStandardMaterial({ map: curseTex })

  const cards: CardMesh[] = []
  const fan = [-0.42, -0.21, 0, 0.21, 0.42]
  const rot = [0.18, 0.09, 0, -0.09, -0.18]

  for (let i = 0; i < 5; i += 1) {
    const mats: THREE.Material[] = [
      edge,
      edge,
      edge,
      edge,
      backMat,
      backMat,
    ]
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.03), mats)
    mesh.castShadow = true
    const cardGroup = new THREE.Group()
    cardGroup.position.set(fan[i]!, 0, -Math.abs(fan[i]!) * 0.15)
    cardGroup.rotation.y = rot[i]!
    cardGroup.add(mesh)
    mesh.rotation.x = -Math.PI / 2
    group.add(cardGroup)

    cards.push({
      id: `slot-${i}`,
      group: cardGroup,
      mesh,
      targetY: 0,
      flipProgress: 0,
      revealed: false,
      removed: false,
      face: 'truth',
      faceApplied: null,
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

  return {
    group,
    cards,
    syncBoard(board: BoardCard[]) {
      for (let i = 0; i < 5; i += 1) {
        const data = board[i]
        const card = cards[i]!
        if (!data) {
          card.group.visible = false
          continue
        }
        card.id = data.id
        card.group.visible = !data.removed
        card.removed = data.removed
        card.mesh.userData.cardId = data.id
        applyFace(card, data.face)

        if (data.revealed && !card.revealed) {
          card.revealed = true
          card.flipProgress = 0.001
        } else if (!data.revealed) {
          card.revealed = false
          card.flipProgress = 0
          card.mesh.rotation.x = -Math.PI / 2
        } else if (card.flipProgress >= 1) {
          card.mesh.rotation.x = -Math.PI / 2 + Math.PI
        }
      }
    },
    update(_t, hoveredId) {
      cards.forEach((card) => {
        if (card.removed || !card.group.visible) return
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
      })
    },
    getPickables() {
      return cards
        .filter((c) => c.group.visible && !c.removed && !c.revealed)
        .map((c) => c.mesh)
    },
  }
}
