import * as THREE from 'three'
import { createWoodTexture } from './textures'
import { texturedMat } from './materialFactory'

/**
 * 거친 나뭇결 책상 메시를 생성한다.
 */
export function createTable(): THREE.Mesh {
  const tex = createWoodTexture()
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1.2)
  const mat = texturedMat({
    map: tex,
    color: 0x1a1510,
    roughness: 0.94,
    metalness: 0.04,
    bumpScale: 0.08,
  })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.4), mat)
  mesh.position.set(0, 0, 0)
  mesh.receiveShadow = true
  mesh.castShadow = true
  return mesh
}
