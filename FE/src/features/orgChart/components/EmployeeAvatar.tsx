import { AVATAR_TINTS } from '../data/orgChart.constants'
import { cn } from '@/utils/cn'

interface EmployeeAvatarProps {
  employeeId: string
  nameKanji: string
  className?: string
}

const tintFor = (employeeId: string): string => {
  const hash = [...employeeId].reduce((total, character) => total + character.charCodeAt(0), 0)
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]
}

export const EmployeeAvatar = ({ employeeId, nameKanji, className }: EmployeeAvatarProps) => {
  const initial = [...nameKanji.replace(/\s/g, '')][0] ?? '?'

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        tintFor(employeeId),
        className,
      )}
    >
      {initial}
    </span>
  )
}
