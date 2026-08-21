import { cn } from '@/utils/cn'

interface ScoreBarProps {
  label: string
  value: number
  /** Optional qualitative rank shown next to the numeric score. */
  rank?: string
  barClassName?: string
}

const MAX_SCORE = 100

export const ScoreBar = ({ label, value, rank, barClassName }: ScoreBarProps) => {
  const percent = Math.min(Math.max(value, 0), MAX_SCORE)

  return (
    <div className={cn('flex flex-col gap-1')}>
      <div className={cn('flex items-baseline justify-between gap-2 text-xs')}>
        <span className={cn('truncate text-muted')}>{label}</span>
        <span className={cn('shrink-0 tabular-nums text-ink')}>
          {rank ? `${rank} · ${value}` : value}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        className={cn('h-1.5 overflow-hidden rounded-full bg-soft')}
      >
        <i
          style={{ width: `${percent}%` }}
          className={cn('block h-full rounded-full bg-indigo', barClassName)}
        />
      </div>
    </div>
  )
}
