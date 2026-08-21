import { useCallback, useState } from 'react'

import { useAuth } from '../context/auth.context'
import {
  registerAccount,
  requestPasswordReset,
  signInWithCredentials,
} from '../services/auth.service'
import type { AuthFormApi, AuthMode } from '../types/authForm.types'
import { type FieldErrors, validate } from '../utils/authValidation'

/**
 * Owns everything the three auth forms share: which screen is showing, the
 * field values, and what a submit actually does. The forms stay presentational,
 * so switching screens cannot leave a half-submitted request behind.
 */
export const useAuthForm = (): AuthFormApi => {
  const { signIn } = useAuth()
  const [mode, setModeState] = useState<AuthMode>('signin')
  const [values, setValues] = useState<Record<string, string>>({})
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setMode = useCallback((next: AuthMode) => {
    // Carry nothing across: a password typed on one screen has no business
    // sitting in the DOM of another.
    setValues({})
    setErrors({})
    setError(null)
    setNotice(null)
    setModeState(next)
  }, [])

  const setField = useCallback((field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    // Clear this field's error as soon as it is edited, so the message goes
    // away when the user acts on it rather than only on the next submit.
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  const runSignIn = useCallback(async () => {
    const result = await signInWithCredentials({
      identifier: values.identifier ?? '',
      password: values.password ?? '',
      remember,
    })

    if (!result.ok) return setError(result.error)
    // A token the issuer accepted but this client cannot use is still a failed
    // sign-in; without this the gate would silently stay put.
    if (!result.token || !signIn(result.token, { remember })) {
      setError('error_unexpected')
    }
  }, [remember, signIn, values])

  const runRegister = useCallback(async () => {
    const result = await registerAccount({
      employeeId: values.employeeId ?? '',
      tenantId: values.tenantId ?? '',
      nameKanji: values.nameKanji ?? '',
      nameKana: values.nameKana ?? '',
      email: values.email ?? '',
      password: values.password ?? '',
    })

    if (!result.ok) return setError(result.error)
    setValues({})
    setNotice('notice_registered')
  }, [values])

  const runForgot = useCallback(async () => {
    const result = await requestPasswordReset(values.email ?? '')
    if (!result.ok) return setError(result.error)
    setValues({})
    setNotice('notice_reset_sent')
  }, [values])

  const submit = useCallback(() => {
    const found = validate(mode, values)
    setErrors(found)
    setError(null)
    setNotice(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const run = mode === 'register' ? runRegister : mode === 'forgot' ? runForgot : runSignIn
    void run().finally(() => setSubmitting(false))
  }, [mode, runForgot, runRegister, runSignIn, values])

  return {
    mode,
    setMode,
    values,
    setField,
    remember,
    setRemember,
    errors,
    error,
    notice,
    submitting,
    submit,
  }
}
