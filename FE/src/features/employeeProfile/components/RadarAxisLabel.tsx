import { wrapAxisLabel } from '../data/radarGeometry'
import type { RadarAxis } from '../types/employeeProfile.types'
import { cn } from '@/utils/cn'

interface RadarAxisLabelProps {
  axis: RadarAxis
  label: string
}

/** Shared by both radars so a label wraps the same way on each. */
export const RadarAxisLabel = ({ axis, label }: RadarAxisLabelProps) => {
  const lines = wrapAxisLabel(label)

  return (
    <text
      x={axis.labelX}
      y={axis.labelY}
      textAnchor={axis.labelAnchor}
      dominantBaseline="middle"
      className={cn('fill-muted text-2xs')}
    >
      {lines.map((line, index) => (
        <tspan
          key={line}
          x={axis.labelX}
          // Two lines straddle the anchor point; one sits on it.
          dy={index === 0 ? (lines.length > 1 ? '-0.5em' : 0) : '1.1em'}
        >
          {line}
        </tspan>
      ))}
    </text>
  )
}
