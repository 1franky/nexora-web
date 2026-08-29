import { useMemo, useRef, useState, type PointerEvent } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { getChartPalette } from './chartPalette'
import { formatMonthLong, formatMonthShort } from './format'

export interface MonthlyDatum {
  month: string
  amount: number
}

interface TrendLineChartProps {
  data: MonthlyDatum[]
  formatValue: (value: number) => string
  ariaLabel: string
}

const WIDTH = 600
const HEIGHT = 180
const PADDING_X = 8
const PADDING_TOP = 24
const PADDING_BOTTOM = 24

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Tendencia en el tiempo, serie única -> una línea, un color, sin leyenda.
 * El crosshair sigue al puntero y hace snap al punto más cercano (nunca
 * hay que apuntar exacto a la línea de 2px). Solo el último punto lleva
 * etiqueta directa; el resto se lee con el crosshair/tooltip o la tabla.
 */
export default function TrendLineChart({ data, formatValue, ariaLabel }: TrendLineChartProps) {
  const { resolvedMode } = useThemeMode()
  const palette = getChartPalette(resolvedMode)
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { points, minValue, maxValue } = useMemo(() => {
    const values = data.map((d) => d.amount)
    const min = Math.min(0, ...values)
    const max = Math.max(...values, min + 1)
    const plotWidth = WIDTH - PADDING_X * 2
    const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const step = data.length > 1 ? plotWidth / (data.length - 1) : 0
    const range = max - min || 1
    const scaleY = (value: number) => PADDING_TOP + plotHeight - ((value - min) / range) * plotHeight
    return {
      minValue: min,
      maxValue: max,
      points: data.map((d, index) => ({ x: PADDING_X + step * index, y: scaleY(d.amount), ...d })),
    }
  }, [data])

  const linePath = points.map((p, index) => `${index === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const baselineY = HEIGHT - PADDING_BOTTOM
  const areaPath = points.length > 0 ? `${linePath} L${points[points.length - 1].x},${baselineY} L${points[0].x},${baselineY} Z` : ''

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || points.length === 0) return
    const rect = svg.getBoundingClientRect()
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - relativeX)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    setHoverIndex(nearestIndex)
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const lastPoint = points[points.length - 1] as (typeof points)[number] | undefined
  const zeroY = PADDING_TOP + (HEIGHT - PADDING_TOP - PADDING_BOTTOM) * (maxValue / (maxValue - minValue || 1))

  return (
    <Box sx={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        style={{ display: 'block', touchAction: 'none' }}
      >
        {minValue < 0 && maxValue > 0 && (
          <line
            x1={PADDING_X}
            x2={WIDTH - PADDING_X}
            y1={zeroY}
            y2={zeroY}
            stroke={palette.baseline}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {areaPath && <path d={areaPath} fill={palette.seriesWash} stroke="none" />}
        <path
          d={linePath}
          fill="none"
          stroke={palette.series}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point, index) => (
          <circle
            key={point.month}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 || index === hoverIndex ? 4 : 2.5}
            fill={palette.series}
            stroke={palette.surface}
            strokeWidth={2}
          />
        ))}
        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PADDING_TOP}
            y2={baselineY}
            stroke={palette.muted}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {lastPoint && (
          <text x={lastPoint.x} y={lastPoint.y - 10} textAnchor="end" fontSize={12} fill={palette.textPrimary}>
            {formatValue(lastPoint.amount)}
          </text>
        )}
        {points.map((point) => (
          <text key={`label-${point.month}`} x={point.x} y={HEIGHT - 6} textAnchor="middle" fontSize={11} fill={palette.textSecondary}>
            {capitalize(formatMonthShort(point.month))}
          </text>
        ))}
      </svg>
      {hovered && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            pointerEvents: 'none',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {capitalize(formatMonthLong(hovered.month))}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatValue(hovered.amount)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
