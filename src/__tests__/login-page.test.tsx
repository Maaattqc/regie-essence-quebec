// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

import LoginPage from '@/app/login/page'

describe('LoginPage', () => {
  beforeEach(() => {
    mocks.redirect.mockReset()
    mocks.redirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); })
  })

  it('redirige vers /?openLogin', () => {
    expect(() => LoginPage()).toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/?openLogin')
  })
})
