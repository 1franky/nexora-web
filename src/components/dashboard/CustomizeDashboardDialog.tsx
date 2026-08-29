import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { WIDGET_BY_ID, type WidgetId } from './widgetDefinitions'
import type { WidgetLayoutEntry } from './useDashboardLayout'

interface CustomizeDashboardDialogProps {
  open: boolean
  layout: WidgetLayoutEntry[]
  onToggle: (id: WidgetId) => void
  onMove: (id: WidgetId, direction: -1 | 1) => void
  onReset: () => void
  onClose: () => void
}

/**
 * Agregar/quitar y reordenar widgets (plan.md, sección 10). Sin
 * drag-and-drop (evita una dependencia nueva solo para esto): el orden es
 * la posición en la lista, movible con flechas arriba/abajo — mismo
 * resultado, más accesible por teclado de entrada.
 */
export default function CustomizeDashboardDialog({ open, layout, onToggle, onMove, onReset, onClose }: CustomizeDashboardDialogProps) {
  const { t } = useTranslation('dashboard')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('customize.title')}</DialogTitle>
      <DialogContent>
        <List dense disablePadding>
          {layout.map((entry, index) => {
            const widget = WIDGET_BY_ID[entry.id]
            const widgetLabel = t(widget.titleKey)
            return (
              <ListItem
                key={entry.id}
                disableGutters
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => onMove(entry.id, -1)}
                      aria-label={t('customize.moveUp', { widget: widgetLabel })}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === layout.length - 1}
                      onClick={() => onMove(entry.id, 1)}
                      aria-label={t('customize.moveDown', { widget: widgetLabel })}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <Checkbox
                  edge="start"
                  checked={entry.visible}
                  onChange={() => onToggle(entry.id)}
                  aria-label={t('customize.toggleVisible', { widget: widgetLabel })}
                />
                <ListItemText primary={widgetLabel} />
              </ListItem>
            )
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onReset}>{t('customize.reset')}</Button>
        <Button variant="contained" onClick={onClose}>
          {t('customize.done')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
