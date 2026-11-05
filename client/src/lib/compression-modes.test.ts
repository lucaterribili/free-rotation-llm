import { describe, expect, it } from 'vitest'
import { engineInMode, MODE_ENGINES } from './compression-modes'

describe('compression modes', () => {
  it('nests: each mode runs everything the previous one does', () => {
    const order = ['off', 'lossless', 'standard', 'aggressive'] as const
    for (let i = 1; i < order.length; i += 1) {
      for (const id of MODE_ENGINES[order[i - 1]!]) expect(engineInMode(order[i]!, id)).toBe(true)
    }
  })
  it('off runs nothing; only aggressive runs the lossy budget engines', () => {
    expect(MODE_ENGINES.off.size).toBe(0)
    expect(engineInMode('standard', 'hard-budget')).toBe(false)
    expect(engineInMode('aggressive', 'hard-budget')).toBe(true)
  })
})
