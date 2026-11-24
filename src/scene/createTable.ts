import * as THREE from 'three'
import { createWoodTexture } from './textures'

/**
 * 넓은 낡은 나무 책상 메시를 생성한다.
 */
export function createTable(): THREE.Mesh {
  const tex = createWoodTexture()
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1.2)
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.92,
    metalness: 0.05,
    color: 0x1a1510,
  })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.4), mat)
  mesh.position.set(0, 0, 0)
  mesh.receiveShadow = true
  mesh.castShadow = true
  return mesh
}
