import { useTranslation } from 'react-i18next'

import {
  RADAR_CENTER_X,
  RADAR_CENTER_Y,
  RADAR_HEIGHT,
  RADAR_RINGS,
  RADAR_TRAIT_KEYS,
  RADAR_WIDTH,
  RadarAxisLabel,
  buildRadarAxes,
  ringPolygonPoints,
  toPolygonPoints,
} from '@/features/employeeProfile'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { EmployeeDetail } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface RadarComparisonChartProps {
  base: EmployeeDetail | null
  target: EmployeeDetail | null
  employeeName: string
}

const entriesFor = (employee: EmployeeDetail | null) =>
  employee ? RADAR_TRAIT_KEYS.map((key) => ({ key, value: employee.traits[key] ?? 0 })) : null

/**
 * Two trait profiles on one radar.
 *
 * Encoding is emphasis, not two categorical hues: the target period is the
 * subject (solid indigo) and the base period is context (muted, dashed). The dash
 * carries the identity a second time, so the layers stay separable without colour
 * — which is also what keeps the pair legible under colour-vision deficiency.
 */
export const RadarComparisonChart = ({ base, target, employeeName }: RadarComparisonChartProps) => {
  const { t } = useTranslation('comparison')
  const labels = useDomainLabels()

  const baseEntries = entriesFor(base)
  const targetEntries = entriesFor(target)
  if (!baseEntries && !targetEntries) {
    return <p className={cn('text-xs text-muted')}>{t('radar_gated')}</p>
  }

  // Label geometry is identical on both layers, so either side can carry the axes.
  const axisSource = targetEntries ?? baseEntries!
  const axes = buildRadarAxes(axisSource)
  const baseAxes = baseEntries ? buildRadarAxes(baseEntries) : null
  const targetAxes = targetEntries ? buildRadarAxes(targetEntries) : null

  return (
    <figure className={cn('m-0 flex flex-col items-center gap-3')}>
      <svg
        viewBox={`0 0 ${RADAR_WIDTH} ${RADAR_HEIGHT}`}
        role="img"
        aria-label={t('radar_title')}
        className={cn('w-full')}
      >
        {/* Grid stays solid hairline: dashing it would read as a threshold. */}
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

        {baseAxes && (
          <polygon
            points={toPolygonPoints(baseAxes)}
            className={cn('fill-muted/10 stroke-muted')}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        )}

        {targetAxes && (
          <polygon
            points={toPolygonPoints(targetAxes)}
            className={cn('fill-indigo/15 stroke-indigo')}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Surface ring keeps the markers readable where the two layers cross. */}
        {targetAxes?.map((axis) => (
          <circle
            key={`point-${axis.key}`}
            cx={axis.x}
            cy={axis.y}
            r={4}
            className={cn('fill-indigo stroke-surface')}
            strokeWidth={2}
          />
        ))}

        {axes.map((axis) => (
          <RadarAxisLabel key={`label-${axis.key}`} axis={axis} label={labels.trait(axis.key)} />
        ))}
      </svg>

      <figcaption className={cn('sr-only')}>{employeeName}</figcaption>

      <RadarLegend />
      <RadarValueTable baseEntries={baseEntries} targetEntries={targetEntries} />
    </figure>
  )
}

const RadarLegend = () => {
  const { t } = useTranslation('comparison')

  return (
    <ul className={cn('flex flex-wrap items-center justify-center gap-4 text-xs text-muted')}>
      <li className={cn('flex items-center gap-2')}>
        <svg width="20" height="8" aria-hidden="true">
          <line
            x1="0"
            y1="4"
            x2="20"
            y2="4"
            className={cn('stroke-muted')}
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        </svg>
        {t('legend_base')}
      </li>
      <li className={cn('flex items-center gap-2')}>
        <svg width="20" height="8" aria-hidden="true">
          <line x1="0" y1="4" x2="20" y2="4" className={cn('stroke-indigo')} strokeWidth={2} />
        </svg>
        {t('legend_target')}
      </li>
    </ul>
  )
}

interface RadarValueTableProps {
  baseEntries: { key: string; value: number }[] | null
  targetEntries: { key: string; value: number }[] | null
}

/** The table view: every axis value stays reachable without reading the polygon. */
const RadarValueTable = ({ baseEntries, targetEntries }: RadarValueTableProps) => {
  const { t } = useTranslation('comparison')
  const labels = useDomainLabels()

  return (
    <ul className={cn('grid w-full gap-x-4 gap-y-1 sm:grid-cols-2')}>
      {RADAR_TRAIT_KEYS.map((key, index) => {
        const baseValue = baseEntries?.[index]?.value ?? null
        const targetValue = targetEntries?.[index]?.value ?? null
        return (
          <li key={key} className={cn('flex items-baseline justify-between gap-2 text-xs')}>
            <span className={cn('truncate text-muted')}>{labels.trait(key)}</span>
            <span className={cn('shrink-0 tabular-nums text-ink')}>
              {baseValue ?? t('no_value')} → {targetValue ?? t('no_value')}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
