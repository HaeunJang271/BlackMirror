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

  // 고딕 의자 등받이
  const chairMat = texturedMat({
    map: createClothTexture(),
    color: 0x1a1510,
    roughness: 0.92,
    bumpScale: 0.05,
  })
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.55, 0.12),
    chairMat,
  )
  back.position.set(0, 1.05, -1.85)
  group.add(back)

  const peak = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.45, 4),
    chairMat,
  )
  peak.position.set(0, 1.95, -1.85)
  group.add(peak)

  const sideL = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.2, 0.1),
    chairMat,
  )
  sideL.position.set(-0.4, 0.95, -1.82)
  const sideR = sideL.clone()
  sideR.position.x = 0.4
  group.add(sideL, sideR)

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
