// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOSSES } from '../../data/bosses'
import { RITUALS } from '../../data/rituals'
import { GameHud } from '../GameHud'

afterEach(cleanup)

describe('mobile ritual selection', () => {
  it('shows the description on the first touch and uses the ritual on the second', () => {
    const onUseRitual = vi.fn()
    const id = 'clairvoyant_coin'
    render(<GameHud boss={BOSSES[0]!} bossLine="" bossHp={10} stageIndex={0}
      board={[]} timerSec={null} expectedDamage={0} multiplier={1} canCashOut={false}
      hand={[id]} ashBreathAvailable relics={[]} inputLocked={false}
      onCashOut={vi.fn()} onUseRitual={onUseRitual} />)
    const button = screen.getByRole('button', { name: RITUALS[id].name })
    const tap = () => {
      const event = new Event('pointerdown', { bubbles: true })
      Object.defineProperty(event, 'pointerType', { value: 'touch' })
      fireEvent(button, event)
      fireEvent.click(button)
    }
    tap()
    expect(screen.getByRole('status').textContent).toContain(RITUALS[id].description)
    expect(onUseRitual).not.toHaveBeenCalled()
    tap()
    expect(onUseRitual).toHaveBeenCalledOnce()
    expect(onUseRitual).toHaveBeenCalledWith(id)
  })

  it('shows the description on the first mouse click and uses the ritual on the second', () => {
    const onUseRitual = vi.fn()
    const id = 'clairvoyant_coin'
    render(<GameHud boss={BOSSES[0]!} bossLine="" bossHp={10} stageIndex={0}
      board={[]} timerSec={null} expectedDamage={0} multiplier={1} canCashOut={false}
      hand={[id]} ashBreathAvailable relics={[]} inputLocked={false}
      onCashOut={vi.fn()} onUseRitual={onUseRitual} />)
    const button = screen.getByRole('button', { name: RITUALS[id].name })
    fireEvent.click(button)
    expect(screen.getByRole('status').textContent).toContain(RITUALS[id].description)
    expect(onUseRitual).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(onUseRitual).toHaveBeenCalledOnce()
    expect(onUseRitual).toHaveBeenCalledWith(id)
  })
})
