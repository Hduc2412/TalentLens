export { AuthProvider } from './context/AuthProvider'
export { useAuth, type AuthContextValue } from './context/auth.context'
export { AuthGate } from './components/AuthGate'
export { AuthPage } from './components/AuthPage'
export { Can } from './components/Can'
export { ForgotPasswordForm } from './components/ForgotPasswordForm'
export { LoginForm } from './components/LoginForm'
export { RegisterForm } from './components/RegisterForm'
export { useAuthForm } from './hooks/useAuthForm'
export {
  registerAccount,
  requestPasswordReset,
  signInWithCredentials,
  type AuthErrorKey,
  type Credentials,
  type RegistrationDetails,
} from './services/auth.service'
export { validate } from './utils/authValidation'
export { primaryRole, usePrimaryRole } from './hooks/usePrimaryRole'
export { useAuthStore } from './store/auth.store'
export { DEMO_IDENTITIES, DEMO_PASSWORD, createDevToken } from './utils/devToken'
export {
  decodeToken,
  isExpired,
  isUsable,
  resolvePermissions,
  secondsUntilExpiry,
  toAuthUser,
} from './utils/jwt'
export {
  CLOCK_SKEW_SECONDS,
  PERMISSIONS,
  ROLES,
  ROLE_LABEL_KEYS,
  ROLE_PERMISSIONS,
  ROLE_PRIORITY,
  TOKEN_STORAGE_KEY,
} from './data/auth.constants'
export type { AuthFormApi, AuthMode } from './types/authForm.types'
export type {
  AuthStatus,
  AuthUser,
  JWTPayload,
  Permission,
  Role,
  TokenUser,
} from './types/auth.types'
