import { describe, expect, it } from 'vitest'

import { createDevToken } from './devToken'
import { decodeToken, isUsable, resolvePermissions, toAuthUser } from './jwt'
import { CLOCK_SKEW_SECONDS } from '../data/auth.constants'

const nowSeconds = () => Math.floor(Date.now() / 1000)

/** Re-encodes edited claims as a token, mirroring what an attacker can do. */
const reissue = (claims: unknown): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(claims))
  const body = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `header.${body}.unsigned`
}

describe('token decoding', () => {
  it('reads the claims of a well-formed token, Kanji intact', () => {
    const payload = decodeToken(createDevToken('HR_ADMIN'))

    expect(payload).toMatchObject({
      aud: 'talentlens-api',
      tenant_id: 'musashino_01',
      roles: ['HR_ADMIN'],
    })
    expect(payload?.user.name_kanji).toBe('山田 太郎')
    expect(payload?.user.name_kana).toBe('ヤマダ タロウ')
  })

  it('rejects anything that is not a three-segment token with the required claims', () => {
    expect(decodeToken('')).toBeNull()
    expect(decodeToken('not-a-token')).toBeNull()
    expect(decodeToken('a.b.c')).toBeNull()
    expect(decodeToken(`${btoa('{}')}.${btoa('{"sub":"x"}')}.sig`)).toBeNull()
  })

  it('drops role names the UI does not implement', () => {
    const payload = decodeToken(createDevToken('HR_ADMIN'))!
    const tampered = reissue({ ...payload, roles: ['HR_ADMIN', 'SUPER_ROOT'] })

    expect(decodeToken(tampered)?.roles).toEqual(['HR_ADMIN'])
  })

  it('treats a token as unusable once past exp plus the shared clock skew', () => {
    const issued = nowSeconds() - 60 * 60 - CLOCK_SKEW_SECONDS - 1
    const payload = decodeToken(createDevToken('HR_ADMIN', issued))

    expect(payload).not.toBeNull()
    expect(isUsable(payload!)).toBe(false)
  })
})

describe('permission resolution', () => {
  it('prefers the explicit permissions claim', () => {
    const payload = decodeToken(createDevToken('HR_MANAGER'))!

    expect(resolvePermissions(payload)).toEqual(['employees:read', 'scenarios:write'])
  })

  it('falls back to the RBAC matrix when the claim is absent', () => {
    const payload = decodeToken(createDevToken('HR_ADMIN'))!
    const withoutClaim = { ...payload, permissions: [] }

    expect(resolvePermissions(withoutClaim)).toContain('employees:read_sensitive')
    expect(resolvePermissions(withoutClaim)).toContain('excel:import')
  })

  it('never grants protected reads or imports to a plain employee', () => {
    const user = toAuthUser(decodeToken(createDevToken('EMPLOYEE'))!)

    expect(user.permissions).toEqual(['employees:read'])
    expect(user.user_id).toBe('usr_e3001')
  })
})
