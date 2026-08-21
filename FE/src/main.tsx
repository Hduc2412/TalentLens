import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/App'
import { AuthGate, AuthProvider } from '@/features/auth'
import '@/i18n/i18n'
import '@/index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root container #root was not found')

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      {/* No credential, no app shell: every screen below assumes a principal. */}
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
)
