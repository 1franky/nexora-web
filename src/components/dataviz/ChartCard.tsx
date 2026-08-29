import { useId, useState, type ReactNode } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import BarChartIcon from '@mui/icons-material/BarChart'
import TableRowsIcon from '@mui/icons-material/TableRows'

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Cada gráfica debe tener una vista de tabla equivalente (misma información, accesible sin color). */
  renderChart: () => ReactNode
  renderTable: () => ReactNode
}

/**
 * Envoltorio común para toda gráfica del dashboard: título, y un toggle
 * gráfica/tabla — ninguna gráfica es la única forma de leer sus valores
 * (ver interaction.md: "todo valor que muestra una gráfica también debe
 * poder leerse sin ella").
 */
export default function ChartCard({ title, subtitle, renderChart, renderTable }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const headingId = useId()

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <div>
            <Typography id={headingId} variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            )}
          </div>
          <Tooltip title={view === 'chart' ? 'Ver como tabla' : 'Ver como gráfica'}>
            <IconButton
              size="small"
              onClick={() => setView((current) => (current === 'chart' ? 'table' : 'chart'))}
              aria-label={view === 'chart' ? 'Ver como tabla' : 'Ver como gráfica'}
            >
              {view === 'chart' ? <TableRowsIcon fontSize="small" /> : <BarChartIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
        <div role="group" aria-labelledby={headingId}>
          {view === 'chart' ? renderChart() : renderTable()}
        </div>
      </CardContent>
    </Card>
  )
}
