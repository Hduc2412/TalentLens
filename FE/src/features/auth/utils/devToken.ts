import { ROLE_PERMISSIONS } from '../data/auth.constants'
import type { JWTPayload, Role } from '../types/auth.types'

/**
 * Mock-mode token issuer.
 *
 * With `VITE_USE_MOCK=true` there is no auth server to sign anything, but the
 * UI should still exercise the real path — decode, store, guard, attach the
 * header — instead of a parallel "pretend I'm an admin" flag. So the demo role
 * switcher mints an unsigned token here. The signature segment is the literal
 * `unsigned`, which no RS256 verifier will ever accept, so one of these can
 * never buy access to a real backend.
 */

/** Every demo account shares one password; it guards nothing. */
export const DEMO_PASSWORD = 'peoplelens'

const DEV_ISSUER = 'https://auth.talentlens.local'
const DEV_AUDIENCE = 'talentlens-api'
const DEV_TENANT = 'musashino_01'
const DEV_TTL_SECONDS = 60 * 60

/**
 * The demo directory mock mode signs people in against. Real deployments never
 * reach this: credentials are the identity provider's business, not ours.
 */
export const DEMO_IDENTITIES: Record<Role, JWTPayload['user']> = {
  HR_ADMIN: {
    employee_id: 'E1001',
    email: 'yamada@musashino.co.jp',
    name_kanji: '山田 太郎',
    name_kana: 'ヤマダ タロウ',
    department_id: 'dept_kimete事業部',
  },
  HR_MANAGER: {
    employee_id: 'E2001',
    email: 'sato@musashino.co.jp',
    name_kanji: '佐藤 花子',
    name_kana: 'サトウ ハナコ',
    department_id: 'dept_kimete事業部',
  },
  EMPLOYEE: {
    employee_id: 'E3001',
    email: 'suzuki@musashino.co.jp',
    name_kanji: '鈴木 一郎',
    name_kana: 'スズキ イチロウ',
    department_id: 'dept_kimete事業部',
  },
}

/** UTF-8 safe base64url: `btoa` alone throws on 山田. */
const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const createDevToken = (role: Role, issuedAt = Math.floor(Date.now() / 1000)): string => {
  const header = { alg: 'none', typ: 'JWT', kid: 'talentlens-dev-key' }
  const payload: JWTPayload = {
    iss: DEV_ISSUER,
    sub: `usr_${DEMO_IDENTITIES[role].employee_id.toLowerCase()}`,
    aud: DEV_AUDIENCE,
    iat: issuedAt,
    nbf: issuedAt,
    exp: issuedAt + DEV_TTL_SECONDS,
    jti: `dev-${role}-${issuedAt}`,
    tenant_id: DEV_TENANT,
    roles: [role],
    permissions: [...ROLE_PERMISSIONS[role]],
    user: DEMO_IDENTITIES[role],
  }

  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.unsigned`
}
