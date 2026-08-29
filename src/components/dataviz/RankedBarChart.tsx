import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { getChartPalette } from './chartPalette'
import EmptyChartState from './EmptyChartState'

export interface RankedBarDatum {
  id: string
  label: string
  value: number
}

interface RankedBarChartProps {
  data: RankedBarDatum[]
  formatValue: (value: number) => string
  emptyMessage: string
}

/**
 * Compara magnitud entre categorías (nominal: el orden de las categorías no
 * tiene significado propio) — un solo color para todas las barras, nunca
 * una por categoría: la longitud ya distingue los valores, colorear por
 * identidad gastaría el canal sin necesidad (choosing-a-form.md).
 * Etiquetas siempre visibles (el valor "en la punta" de cada barra), así
 * que el valor es legible sin depender de hover.
 */
export default function RankedBarChart({ data, formatValue, emptyMessage }: RankedBarChartProps) {
  const { resolvedMode } = useThemeMode()
  const palette = getChartPalette(resolvedMode)

  if (data.length === 0) {
    return <EmptyChartState message={emptyMessage} />
  }

  const sorted = [...data].sort((a, b) => b.value - a.value)
  const max = Math.max(...sorted.map((d) => d.value), 1)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {sorted.map((item) => {
        const widthPct = Math.max((item.value / max) * 100, 2)
        return (
          <Box
            key={item.id}
            tabIndex={0}
            role="img"
            aria-label={`${item.label}: ${formatValue(item.value)}`}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, outline: 'none', borderRadius: 1 }}
          >
            <Typography
              variant="body2"
              noWrap
              title={item.label}
              sx={{ width: 112, flexShrink: 0, color: 'text.secondary' }}
            >
              {item.label}
            </Typography>
            <Box sx={{ flexGrow: 1, height: 20 }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${widthPct}%`,
                  bgcolor: palette.series,
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{ width: 96, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatValue(item.value)}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
