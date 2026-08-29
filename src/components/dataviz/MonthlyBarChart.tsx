import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { getChartPalette } from './chartPalette'
import { formatMonthLong, formatMonthShort } from './format'

export interface MonthlyDatum {
  month: string
  amount: number
}

interface MonthlyBarChartProps {
  data: MonthlyDatum[]
  formatValue: (value: number) => string
}

const PLOT_HEIGHT = 140

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Serie única (un mes = un valor), así que un solo color y sin leyenda (el
 * título de la tarjeta ya dice qué se grafica). Solo se etiqueta el mes
 * actual (el más reciente) directamente — el resto se lee por eje + tooltip
 * + la vista de tabla, nunca "un número en cada barra".
 */
export default function MonthlyBarChart({ data, formatValue }: MonthlyBarChartProps) {
  const { resolvedMode } = useThemeMode()
  const palette = getChartPalette(resolvedMode)
  const max = Math.max(...data.map((d) => d.amount), 1)

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          height: PLOT_HEIGHT,
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {data.map((point, index) => {
          const isLast = index === data.length - 1
          const barHeight = point.amount > 0 ? Math.max((point.amount / max) * PLOT_HEIGHT, 4) : 0
          return (
            <Box
              key={point.month}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
              }}
            >
              {isLast && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: barHeight + 4,
                    color: 'text.secondary',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatValue(point.amount)}
                </Typography>
              )}
              <Tooltip title={`${capitalize(formatMonthLong(point.month))}: ${formatValue(point.amount)}`}>
                <Box
                  tabIndex={0}
                  role="img"
                  aria-label={`${capitalize(formatMonthLong(point.month))}: ${formatValue(point.amount)}`}
                  sx={{
                    width: '100%',
                    maxWidth: 28,
                    height: barHeight,
                    bgcolor: palette.series,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    outline: 'none',
                  }}
                />
              </Tooltip>
            </Box>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
        {data.map((point) => (
          <Typography
            key={point.month}
            variant="caption"
            sx={{ flex: 1, textAlign: 'center', color: 'text.secondary' }}
          >
            {capitalize(formatMonthShort(point.month))}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
