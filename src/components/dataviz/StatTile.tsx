import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

interface StatTileProps {
  label: string
  value: string
  /** Tono del valor cuando el signo importa (ej. balance mensual negativo). */
  tone?: 'default' | 'positive' | 'negative'
  /** Si se pasa, el tile completo se vuelve clickeable (ej. llevar a su detalle). */
  onClick?: () => void
}

/**
 * Contrato de stat tile (marks-and-anatomy.md): label en sentence case sin
 * dos puntos, valor en cifras proporcionales (nunca tabular-nums en un
 * número grande y aislado — eso es solo para columnas que deben alinear).
 */
export default function StatTile({ label, value, tone = 'default', onClick }: StatTileProps) {
  const content = (
    <CardContent>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          fontVariantNumeric: 'proportional-nums',
          color: tone === 'positive' ? 'success.main' : tone === 'negative' ? 'error.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </CardContent>
  )

  return (
    <Card variant="outlined">
      {onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}
    </Card>
  )
}
