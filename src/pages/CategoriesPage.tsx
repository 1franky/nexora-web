import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArchiveIcon from '@mui/icons-material/Archive'
import EditIcon from '@mui/icons-material/Edit'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import {
  activateCategory,
  archiveCategory,
  listCategories,
  type Category,
  type CategoryType,
} from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/apiError'
import EmptyChartState from '../components/dataviz/EmptyChartState'
import QuickCreateCategoryDialog from '../components/transactions/QuickCreateCategoryDialog'
import RenameCategoryDialog from '../components/categories/RenameCategoryDialog'

export default function CategoriesPage() {
  const { t } = useTranslation('categories')
  const queryClient = useQueryClient()

  const { data: categories, isLoading, isError } = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  const [createType, setCreateType] = useState<CategoryType>('EXPENSE')
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Category | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const archiveMutation = useMutation({
    mutationFn: archiveCategory,
    onSuccess: () => {
      setMutationError(null)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const activateMutation = useMutation({
    mutationFn: activateCategory,
    onSuccess: () => {
      setMutationError(null)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, t('common:errors.generic'))),
  })

  const openCreate = (type: CategoryType) => {
    setCreateType(type)
    setCreateOpen(true)
  }

  const pendingId = archiveMutation.isPending
    ? archiveMutation.variables
    : activateMutation.isPending
      ? activateMutation.variables
      : null

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMutationError(null)}>
          {mutationError}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{t('loadError')}</Alert>}

      {categories && (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CategorySection
              heading={t('expenses')}
              categories={categories.filter((c) => c.type === 'EXPENSE')}
              emptyMessage={t('emptyExpenses')}
              pendingId={pendingId}
              onCreate={() => openCreate('EXPENSE')}
              onRename={setRenameTarget}
              onArchive={(category) => archiveMutation.mutate(category.id)}
              onActivate={(category) => activateMutation.mutate(category.id)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CategorySection
              heading={t('income')}
              categories={categories.filter((c) => c.type === 'INCOME')}
              emptyMessage={t('emptyIncome')}
              pendingId={pendingId}
              onCreate={() => openCreate('INCOME')}
              onRename={setRenameTarget}
              onArchive={(category) => archiveMutation.mutate(category.id)}
              onActivate={(category) => activateMutation.mutate(category.id)}
            />
          </Grid>
        </Grid>
      )}

      <QuickCreateCategoryDialog
        open={createOpen}
        type={createType}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />
      <RenameCategoryDialog category={renameTarget} onClose={() => setRenameTarget(null)} />
    </Box>
  )
}

function CategorySection({
  heading,
  categories,
  emptyMessage,
  pendingId,
  onCreate,
  onRename,
  onArchive,
  onActivate,
}: {
  heading: string
  categories: Category[]
  emptyMessage: string
  pendingId: string | null
  onCreate: () => void
  onRename: (category: Category) => void
  onArchive: (category: Category) => void
  onActivate: (category: Category) => void
}) {
  const { t } = useTranslation('categories')

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          {heading}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={onCreate}>
          {t('newCategory')}
        </Button>
      </Stack>

      {categories.length === 0 ? (
        <EmptyChartState message={emptyMessage} />
      ) : (
        <List disablePadding>
          {categories.map((category) => {
            const isArchived = category.status === 'ARCHIVED'
            const isPending = pendingId === category.id
            return (
              <ListItem
                key={category.id}
                divider
                sx={{ opacity: isArchived ? 0.6 : 1, pl: 0 }}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={t('rename')}>
                      <span>
                        <IconButton size="small" onClick={() => onRename(category)} disabled={isPending} aria-label={t('rename')}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {isArchived ? (
                      <Tooltip title={t('activate')}>
                        <span>
                          <IconButton size="small" onClick={() => onActivate(category)} disabled={isPending} aria-label={t('activate')}>
                            <UnarchiveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t('archive')}>
                        <span>
                          <IconButton size="small" onClick={() => onArchive(category)} disabled={isPending} aria-label={t('archive')}>
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{category.name}</Typography>
                      {isArchived && <Chip size="small" label={t('archived')} />}
                    </Stack>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      )}
    </Paper>
  )
}
