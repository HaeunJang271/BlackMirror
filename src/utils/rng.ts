/**
 * Mulberry32 기반 시드 RNG. 테스트 재현성을 위해 순수하게 유지한다.
 */
export function createRng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 배열을 인플레이스 셔플한다.
 */
export function shuffleInPlace<T>(items: T[], rand: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = items[i]!
    items[i] = items[j]!
    items[j] = tmp
  }
  return items
}

/**
 * 배열에서 n개를 중복 없이 뽑는다.
 */
export function pickN<T>(items: T[], n: number, rand: () => number): T[] {
  const copy = [...items]
  shuffleInPlace(copy, rand)
  return copy.slice(0, Math.min(n, copy.length))
}
