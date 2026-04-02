// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  const from = vi.fn(() => ({ insert }))
  return { from, insert }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: mocks.from },
}))

import { logActivity } from '@/lib/activity-log'

describe('logActivity', () => {
  it('insère avec les bons champs', async () => {
    mocks.insert.mockResolvedValue({ error: null })

    await logActivity('cron', 'snapshot', 'Snapshot réussi', { count: 42 })

    expect(mocks.from).toHaveBeenCalledWith('activity_logs')
    expect(mocks.insert).toHaveBeenCalledWith({
      category: 'cron',
      action: 'snapshot',
      detail: 'Snapshot réussi',
      metadata: { count: 42 },
    })
  })

  it('gère detail et metadata optionnels', async () => {
    mocks.insert.mockResolvedValue({ error: null })

    await logActivity('auth', 'login')

    expect(mocks.insert).toHaveBeenCalledWith({
      category: 'auth',
      action: 'login',
      detail: null,
      metadata: {},
    })
  })

  it('ne lance jamais d\'erreur même si l\'insert échoue', async () => {
    mocks.insert.mockRejectedValue(new Error('DB down'))

    await expect(logActivity('erreur', 'crash')).resolves.toBeUndefined()
  })
})
