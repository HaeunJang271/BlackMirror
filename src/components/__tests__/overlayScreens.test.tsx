import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BOSSES } from '../../data/bosses'
import { OverlayScreens } from '../OverlayScreens'

function gameOver(freeRevive: boolean, hasUsedRevive = false) {
  return renderToStaticMarkup(<OverlayScreens
    phase="GAME_OVER" boss={BOSSES[0]!} hasUsedRevive={hasUsedRevive}
    freeRevive={freeRevive} adBusy={false} adError={null}
    onStart={vi.fn()} onEnableAudio={vi.fn()} onPlayMusic={vi.fn()}
    onConfirmIntro={vi.fn()} onRetry={vi.fn()} onRevive={vi.fn()}
  />)
}

describe('게임 오버 부활 버튼', () => {
  it('원스토어에서는 무료 부활을 표시하고 광고 문구를 표시하지 않는다', () => {
    const html = gameOver(true)
    expect(html).toContain('촛불 1개 되살리기')
    expect(html).not.toContain('광고')
  })

  it('기존 웹에서는 광고 문구를 유지하고, 부활 후에는 버튼을 숨긴다', () => {
    expect(gameOver(false)).toContain('광고 보고')
    expect(gameOver(true, true)).not.toContain('촛불 1개 되살리기')
  })
})
