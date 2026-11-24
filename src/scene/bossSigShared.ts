import * as THREE from 'three'

export type BossHandPose = 'orb' | 'prayer' | 'steeple'

export interface BossSignature {
  /** 얼굴·머리 시그니처 (maskGroup에 부착). */
  root: THREE.Group
  /** 가슴·어깨 장식 (upper에 부착). */
  torso: THREE.Group
  spinners: THREE.Object3D[]
  hideLeftEye: boolean
  hideRightEye: boolean
  eyeColor: THREE.Color
  faceLightColor: number
  faceLightIntensity: number
  handPose: BossHandPose
  showPaleFace: boolean
}

/**
 * 브러시드 브라스 머티리얼.
 */
export function brassMat(
  emissiveHex = 0xc5a059,
  intensity = 1.4,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xa88848,
    emissive: new THREE.Color(emissiveHex),
    emissiveIntensity: intensity,
    metalness: 0.82,
    roughness: 0.38,
    flatShading: true,
  })
}

/**
 * 카메라 향 얇은 톱니 원판.
 */
export function makeFlatGear(radius: number, teeth: number): THREE.Group {
  const g = new THREE.Group()
  const mat = brassMat(0xc5a059, 1.5)
  g.add(new THREE.Mesh(new THREE.CircleGeometry(radius * 0.68, 10), mat))
  for (let i = 0; i < teeth; i += 1) {
    const tooth = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 0.26, radius * 0.32),
      mat,
    )
    const a = (i / teeth) * Math.PI * 2
    tooth.position.set(
      Math.cos(a) * radius * 0.82,
      Math.sin(a) * radius * 0.82,
      0,
    )
    tooth.rotation.z = a
    g.add(tooth)
  }
  return g
}
