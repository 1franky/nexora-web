import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { createCategory, type Category, type CategoryType } from '../../api/categoriesApi'
import { getApiErrorMessage } from '../../api/apiError'

interface QuickCreateCategoryDialogProps {
  open: boolean
  type: CategoryType
  onClose: () => void
  onCreated: (category: Category) => void
}

/**
 * La gestión completa de categorías (editar, archivar) vive en su propio
 * módulo, todavía "próximamente". Esto solo cubre lo mínimo para no quedar
 * bloqueado al categorizar un movimiento: nombre + el tipo ya implícito por
 * el movimiento que se está creando.
 */
export default function QuickCreateCategoryDialog({ open, type, onClose, onCreated }: QuickCreateCategoryDialogProps) {
  const { t } = useTranslation('transactions')
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setName('')
      setError(null)
      onCreated(category)
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const handleClose = () => {
    setName('')
    setError(null)
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    mutation.mutate({ name, type })
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('newCategoryDialog.title')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('newCategoryDialog.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!name.trim()}>
            {t('newCategoryDialog.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
