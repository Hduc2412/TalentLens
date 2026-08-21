import type { FieldErrors } from '../utils/authValidation'

/** The three screens the sign-in page switches between. */
export type AuthMode = 'signin' | 'register' | 'forgot'

/**
 * One shape passed down to every form, so a form is presentation only: it owns
 * no state and decides nothing about what happens on submit.
 */
export interface AuthFormApi {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  values: Record<string, string>
  setField: (field: string, value: string) => void
  remember: boolean
  setRemember: (remember: boolean) => void
  errors: FieldErrors
  /** i18n key of the failure banner, or null. */
  error: string | null
  /** i18n key of the success banner, or null. */
  notice: string | null
  submitting: boolean
  submit: () => void
}
