import { useTranslation } from 'react-i18next'

import {
  RADAR_CENTER_X,
  RADAR_CENTER_Y,
  RADAR_HEIGHT,
  RADAR_RINGS,
  RADAR_WIDTH,
  buildRadarAxes,
  ringPolygonPoints,
  toPolygonPoints,
} from '../data/radarGeometry'
import { RadarAxisLabel } from './RadarAxisLabel'
import type { RadarEntry } from '../types/employeeProfile.types'
import { useDomainLabels } from '@/i18n/domainLabels'
import { cn } from '@/utils/cn'

interface RadarChartProps {
  entries: readonly RadarEntry[]
  employeeName: string
}

export const RadarChart = ({ entries, employeeName }: RadarChartProps) => {
  const { t } = useTranslation('employee_profile')
  const labels = useDomainLabels()
  const axes = buildRadarAxes(entries)

  return (
    <figure className={cn('m-0 flex flex-col items-center gap-2')}>
      <svg
        viewBox={`0 0 ${RADAR_WIDTH} ${RADAR_HEIGHT}`}
        role="img"
        aria-label={t('radar_label', { name: employeeName })}
        className={cn('w-full')}
      >
        {RADAR_RINGS.map((ratio) => (
          <polygon
            key={ratio}
            points={ringPolygonPoints(axes.length, ratio)}
            className={cn('fill-none stroke-hairline')}
            strokeWidth={1}
          />
        ))}

        {axes.map((axis) => (
          <line
            key={`axis-${axis.key}`}
            x1={RADAR_CENTER_X}
            y1={RADAR_CENTER_Y}
            x2={axis.axisX}
            y2={axis.axisY}
            className={cn('stroke-hairline')}
            strokeWidth={1}
          />
        ))}

        <polygon
          points={toPolygonPoints(axes)}
          className={cn('fill-indigo/20 stroke-indigo')}
          strokeWidth={2}
        />

        {axes.map((axis) => (
          <circle
            key={`point-${axis.key}`}
            cx={axis.x}
            cy={axis.y}
            r={3}
            className={cn('fill-indigo')}
          />
        ))}

        {axes.map((axis) => (
          <RadarAxisLabel key={`label-${axis.key}`} axis={axis} label={labels.trait(axis.key)} />
        ))}
      </svg>

      <figcaption className={cn('text-xs text-muted')}>{t('radar_caption')}</figcaption>
      <RadarValues entries={entries} />
    </figure>
  )
}

const RadarValues = ({ entries }: { entries: readonly RadarEntry[] }) => {
  const labels = useDomainLabels()

  return (
    <ul className={cn('grid w-full grid-cols-2 gap-x-4 gap-y-1')}>
      {entries.map((entry) => (
        <li key={entry.key} className={cn('flex items-baseline justify-between gap-2 text-xs')}>
          <span className={cn('truncate text-muted')}>{labels.trait(entry.key)}</span>
          <span className={cn('shrink-0 tabular-nums text-ink')}>{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}
