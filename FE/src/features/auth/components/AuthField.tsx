import { Eye, EyeSlash } from '@phosphor-icons/react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'

interface AuthFieldProps {
  name: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  /** i18n key of this field's validation message, if any. */
  error?: string
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
}

const INPUT = cn(
  'h-11 w-full rounded-xl border bg-canvas px-3 text-sm text-ink outline-none',
  'placeholder:text-muted focus:border-indigo',
)

/**
 * One labelled input with its message slot.
 *
 * The message is wired through `aria-describedby` and `aria-invalid` so a
 * screen reader hears why a field was rejected instead of only seeing red.
 */
export const AuthField = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
}: AuthFieldProps) => {
  const { t } = useTranslation('auth')
  const id = useId()
  const [revealed, setRevealed] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword && revealed ? 'text' : type

  return (
    <div className={cn('flex flex-col gap-1')}>
      <label htmlFor={id} className={cn('text-xs font-medium text-muted')}>
        {label}
      </label>

      <div className={cn('relative')}>
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(INPUT, error ? 'border-low' : 'border-hairline', isPassword && 'pr-11')}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((shown) => !shown)}
            aria-label={t(revealed ? 'password_hide' : 'password_show')}
            aria-pressed={revealed}
            className={cn(
              'absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted',
              'hover:text-ink',
            )}
          >
            {revealed ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className={cn('text-xs text-low')}>
          {t(error)}
        </p>
      )}
    </div>
  )
}

/** Primary action of a form: full width, busy state, never double-fires. */
export const AuthSubmit = ({ label, busy }: { label: string; busy: boolean }) => (
  <button
    type="submit"
    disabled={busy}
    className={cn(
      'mt-1 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm',
      'font-semibold text-surface bg-linear-to-r from-indigo to-cyan disabled:opacity-50',
    )}
  >
    {label}
  </button>
)

/** Form-level outcome: a failure to fix, or confirmation that it worked. */
export const AuthBanner = ({ error, notice }: { error: string | null; notice: string | null }) => {
  const { t } = useTranslation('auth')
  if (!error && !notice) return null

  return (
    <p
      role={error ? 'alert' : 'status'}
      className={cn(
        'rounded-xl px-3 py-2 text-xs',
        error ? 'bg-low/10 text-low' : 'bg-good/10 text-good',
      )}
    >
      {t(error ?? notice ?? '')}
    </p>
  )
}

/** Inline "switch to the other screen" link. */
export const AuthModeLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn('text-xs font-medium text-indigo hover:underline')}
  >
    {label}
  </button>
)
