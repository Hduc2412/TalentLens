import { useEffect, type ReactNode } from 'react'

import { AuthPage } from './AuthPage'
import { useAuth } from '../context/auth.context'
import { createDevToken } from '../utils/devToken'
import { USE_MOCK } from '@/services/organizationService'

/**
 * Mock mode signs itself in so the demo is one click away. Set
 * `VITE_AUTO_SIGN_IN=false` to face the sign-in page while still reading mock
 * data — that is how the login flow gets exercised without a backend.
 */
const AUTO_SIGN_IN = USE_MOCK && import.meta.env.VITE_AUTO_SIGN_IN !== 'false'

/**
 * Renders the app only for an authenticated principal, and the sign-in page
 * for everyone else. No credential, no app shell — in every mode.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, status, signIn } = useAuth()

  /**
   * Only the cold start is greeted.
   *
   * Reacting to `isAuthenticated` alone made signing out unreachable: the flag
   * flipped false, this effect re-ran, and the session came straight back — so
   * the header's sign-out button did nothing. `signed_out` and `expired` are
   * distinct states precisely so they can be left alone.
   */
  useEffect(() => {
    if (!AUTO_SIGN_IN || status !== 'anonymous') return
    signIn(createDevToken('HR_ADMIN'))
  }, [signIn, status])

  if (isAuthenticated) return <>{children}</>

  // Blank only while that first sign-in is in flight; rendering the page there
  // would flash a login screen nobody was asked to fill in.
  if (AUTO_SIGN_IN && status === 'anonymous') return null

  return <AuthPage />
}
