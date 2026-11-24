import * as THREE from 'three'
import { createBrassTexture, texturedMat } from './materialFactory'

export interface ScaleRig {
  group: THREE.Group
  /**
   * 예상 데미지/배수에 따라 접시를 기울인다.
   */
  setTilt: (amount: number) => void
  update: (t: number) => void
}

/**
 * 브러시드 브라스 저울.
 */
export function createScale(): ScaleRig {
  const group = new THREE.Group()
  group.position.set(0.55, 0.08, -0.62)

  const brass = texturedMat({
    map: createBrassTexture(),
    roughness: 0.38,
    metalness: 0.78,
    bumpScale: 0.035,
  })

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.06, 8),
    brass,
  )
  base.position.y = 0.03
  group.add(base)

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.45, 6),
    brass,
  )
  pole.position.y = 0.28
  group.add(pole)

  const beam = new THREE.Group()
  beam.position.y = 0.5
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.025), brass))

  const leftDish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.02, 8),
    brass,
  )
  leftDish.position.set(-0.32, -0.12, 0)
  const rightDish = leftDish.clone()
  rightDish.position.set(0.32, -0.12, 0)
  beam.add(leftDish, rightDish)

  const leftChain = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.01), brass)
  leftChain.position.set(-0.32, -0.05, 0)
  const rightChain = leftChain.clone()
  rightChain.position.set(0.32, -0.05, 0)
  beam.add(leftChain, rightChain)
  group.add(beam)

  let targetTilt = 0
  let currentTilt = 0

  return {
    group,
    setTilt(amount: number) {
      targetTilt = THREE.MathUtils.clamp(amount, -0.45, 0.45)
    },
    update(_t: number) {
      currentTilt = THREE.MathUtils.lerp(currentTilt, targetTilt, 0.08)
      beam.rotation.z = currentTilt
    },
  }
}
