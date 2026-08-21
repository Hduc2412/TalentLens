import type { AuthMode } from '../types/authForm.types'

/**
 * Field validation.
 *
 * Values are i18n keys rather than sentences: the form renders them, the rules
 * stay language-free. Client-side checks catch typos early; they are never the
 * reason a credential is accepted — the identity provider decides that.
 */

export type FieldErrors = Record<string, string>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPLOYEE_ID_PATTERN = /^[A-Za-z]\d{3,}$/
/** Kana, Kanji and the spaces Japanese names are written with. */
const JAPANESE_NAME_PATTERN =
  /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u30fc\s\u3000]+$/u

const MIN_PASSWORD_LENGTH = 8

export const isEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim())

const required = (values: Record<string, string>, fields: string[]): FieldErrors =>
  Object.fromEntries(
    fields.filter((field) => !values[field]?.trim()).map((field) => [field, 'error_required']),
  )

const validateSignIn = (values: Record<string, string>): FieldErrors =>
  required(values, ['identifier', 'password'])

const validateRegister = (values: Record<string, string>): FieldErrors => {
  const errors = required(values, [
    'employeeId',
    'tenantId',
    'nameKanji',
    'nameKana',
    'email',
    'password',
    'passwordConfirm',
  ])

  if (!errors.employeeId && !EMPLOYEE_ID_PATTERN.test(values.employeeId.trim())) {
    errors.employeeId = 'error_employee_id_format'
  }
  if (!errors.nameKanji && !JAPANESE_NAME_PATTERN.test(values.nameKanji.trim())) {
    errors.nameKanji = 'error_japanese_only'
  }
  if (!errors.nameKana && !JAPANESE_NAME_PATTERN.test(values.nameKana.trim())) {
    errors.nameKana = 'error_japanese_only'
  }
  if (!errors.email && !isEmail(values.email)) errors.email = 'error_email_format'
  if (!errors.password && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'error_password_too_short'
  }
  if (!errors.passwordConfirm && values.password !== values.passwordConfirm) {
    errors.passwordConfirm = 'error_password_mismatch'
  }

  return errors
}

const validateForgot = (values: Record<string, string>): FieldErrors => {
  const errors = required(values, ['email'])
  if (!errors.email && !isEmail(values.email)) errors.email = 'error_email_format'
  return errors
}

export const validate = (mode: AuthMode, values: Record<string, string>): FieldErrors => {
  if (mode === 'register') return validateRegister(values)
  if (mode === 'forgot') return validateForgot(values)
  return validateSignIn(values)
}
