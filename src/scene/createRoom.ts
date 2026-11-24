import * as THREE from 'three'
import {
  createClothTexture,
  createWallTexture,
  texturedMat,
} from './materialFactory'

export interface RoomRig {
  group: THREE.Group
  dust: THREE.Points
  /**
   * 먼지·빛기둥 미세 애니메이션.
   */
  update: (t: number) => void
}

/**
 * 낡은 밀실: 벽면, 고딕 의자, 먼지, 볼류메트릭 빛기둥.
 */
export function createRoom(): RoomRig {
  const group = new THREE.Group()

  const wallMap = createWallTexture()
  wallMap.repeat.set(3, 2)
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4.5),
    texturedMat({ map: wallMap, roughness: 0.95, bumpScale: 0.06 }),
  )
  wall.position.set(0, 1.6, -2.85)
  group.add(wall)

  // 고딕 의자 — 보스 정면 뒤에서 빼 실루엣이 겹치지 않게 우측 후방으로
  const chairMat = texturedMat({
    map: createClothTexture(),
    color: 0x1a1510,
    roughness: 0.92,
    bumpScale: 0.05,
  })
  const chair = new THREE.Group()
  chair.position.set(0.95, 0, -2.15)
  chair.rotation.y = -0.35
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.35, 0.1),
    chairMat,
  )
  back.position.set(0, 0.95, 0)
  const peak = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 4), chairMat)
  peak.position.set(0, 1.75, 0)
  const sideL = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 1.05, 0.08),
    chairMat,
  )
  sideL.position.set(-0.32, 0.85, 0.02)
  const sideR = sideL.clone()
  sideR.position.x = 0.32
  chair.add(back, peak, sideL, sideR)
  group.add(chair)

  // 미세 먼지
  const count = 52
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 3.2
    positions[i * 3 + 1] = 0.2 + Math.random() * 2.2
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const dust = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xc5b08a,
      size: 0.018,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  )
  group.add(dust)

  return {
    group,
    dust,
    update(t: number) {
      const arr = dust.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < count; i += 1) {
        const y = arr.getY(i) + Math.sin(t * 0.4 + i) * 0.0008
        arr.setY(i, y > 2.5 ? 0.25 : y)
        arr.setX(i, arr.getX(i) + Math.sin(t * 0.2 + i * 0.7) * 0.0005)
      }
      arr.needsUpdate = true
    },
  }
}
