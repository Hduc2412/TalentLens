import type { RadarAxis, RadarEntry } from '../types/employeeProfile.types'

/**
 * The plot is square but the canvas is not: axis labels only ever run off the
 * left and right edges, so the box is widened horizontally to hold them. Japanese
 * labels are short enough either way; English ones ("Attention to detail") are
 * what forced the extra room.
 */
export const RADAR_WIDTH = 360
export const RADAR_HEIGHT = 248
export const RADAR_CENTER_X = RADAR_WIDTH / 2
export const RADAR_CENTER_Y = RADAR_HEIGHT / 2
export const RADAR_RADIUS = 78
export const RADAR_LABEL_RADIUS = 94
export const RADAR_RINGS = [0.25, 0.5, 0.75, 1] as const

/** Past this many characters a label is split over two lines instead of clipped. */
const LABEL_WRAP_LIMIT = 13

const MAX_SCORE = 100
const QUARTER_TURN = Math.PI / 2
const ANCHOR_EPSILON = 0.01

const anchorFor = (x: number): RadarAxis['labelAnchor'] => {
  if (x > ANCHOR_EPSILON) return 'start'
  if (x < -ANCHOR_EPSILON) return 'end'
  return 'middle'
}

/**
 * Break a long label at the space nearest its middle, so neither line dominates.
 * Labels with no space — every Japanese one — are returned untouched: a forced
 * mid-word break reads worse than a long line.
 */
export const wrapAxisLabel = (label: string): string[] => {
  if (label.length <= LABEL_WRAP_LIMIT) return [label]

  const spaces = [...label].flatMap((character, index) => (character === ' ' ? [index] : []))
  if (spaces.length === 0) return [label]

  const middle = label.length / 2
  const split = spaces.reduce((best, index) =>
    Math.abs(index - middle) < Math.abs(best - middle) ? index : best,
  )
  return [label.slice(0, split), label.slice(split + 1)]
}

/**
 * Project scores onto radar coordinates.
 *
 * The first axis points straight up and the rest run clockwise, which is the
 * reading order of the labels around the chart.
 */
export const buildRadarAxes = (entries: readonly RadarEntry[]): RadarAxis[] =>
  entries.map((entry, index) => {
    const angle = (index / entries.length) * 2 * Math.PI - QUARTER_TURN
    const unitX = Math.cos(angle)
    const unitY = Math.sin(angle)
    const ratio = Math.min(Math.max(entry.value, 0), MAX_SCORE) / MAX_SCORE

    return {
      ...entry,
      angle,
      x: RADAR_CENTER_X + unitX * RADAR_RADIUS * ratio,
      y: RADAR_CENTER_Y + unitY * RADAR_RADIUS * ratio,
      axisX: RADAR_CENTER_X + unitX * RADAR_RADIUS,
      axisY: RADAR_CENTER_Y + unitY * RADAR_RADIUS,
      labelX: RADAR_CENTER_X + unitX * RADAR_LABEL_RADIUS,
      labelY: RADAR_CENTER_Y + unitY * RADAR_LABEL_RADIUS,
      labelAnchor: anchorFor(unitX),
    }
  })

export const toPolygonPoints = (axes: readonly RadarAxis[]): string =>
  axes.map((axis) => `${axis.x.toFixed(2)},${axis.y.toFixed(2)}`).join(' ')

export const ringPolygonPoints = (axisCount: number, ratio: number): string =>
  Array.from({ length: axisCount }, (_, index) => {
    const angle = (index / axisCount) * 2 * Math.PI - QUARTER_TURN
    const x = RADAR_CENTER_X + Math.cos(angle) * RADAR_RADIUS * ratio
    const y = RADAR_CENTER_Y + Math.sin(angle) * RADAR_RADIUS * ratio
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
