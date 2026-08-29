import { useEffect, useState, type FormEvent } from 'react'
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
import { renameCategory, type Category } from '../../api/categoriesApi'
import { getApiErrorMessage } from '../../api/apiError'

interface RenameCategoryDialogProps {
  /** null = cerrado; la categoría a renombrar cuando está abierto. */
  category: Category | null
  onClose: () => void
}

export default function RenameCategoryDialog({ category, onClose }: RenameCategoryDialogProps) {
  const { t } = useTranslation('categories')
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Precarga el nombre actual cada vez que se abre para una categoría distinta.
  useEffect(() => {
    if (category) {
      setName(category.name)
      setError(null)
    }
  }, [category])

  const mutation = useMutation({
    mutationFn: (newName: string) => {
      if (!category) throw new Error('No hay categoría seleccionada.')
      return renameCategory(category.id, newName)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setError(null)
    mutation.mutate(name.trim())
  }

  return (
    <Dialog open={category !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('renameDialog.title')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('renameDialog.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!name.trim()}>
            {t('renameDialog.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
