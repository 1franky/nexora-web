import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import {
  dateInputToEndOfDayIso,
  dateInputToStartOfDayIso,
  downloadSatInvoiceXml,
  listSatInvoices,
  type CfdiInvoice,
  type CfdiInvoiceType,
} from '../api/satApi'
import { getApiErrorMessage } from '../api/apiError'
import { formatCurrencyIn } from '../components/dataviz/format'
import EmptyChartState from '../components/dataviz/EmptyChartState'

const TYPES: CfdiInvoiceType[] = ['EMITIDAS', 'RECIBIDAS']

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default function SatInvoicesPage() {
  const { t } = useTranslation('sat')

  const [tipo, setTipo] = useState<CfdiInvoiceType | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [texto, setTexto] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(25)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Buscador con debounce: evita disparar una petición por cada tecla.
  useEffect(() => {
    const handle = setTimeout(() => {
      setTexto(searchInput.trim())
      setPage(0)
    }, 400)
    return () => clearTimeout(handle)
  }, [searchInput])

  const rangeIsValid = (from === '' && to === '') || (from !== '' && to !== '' && from <= to)

  const desde = from && rangeIsValid ? dateInputToStartOfDayIso(from) : undefined
  const hasta = to && rangeIsValid ? dateInputToEndOfDayIso(to) : undefined

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['sat', 'invoices', tipo, desde, hasta, texto, page, size],
    queryFn: () =>
      listSatInvoices({
        tipo: tipo || undefined,
        desde,
        hasta,
        texto: texto || undefined,
        page,
        size,
      }),
    enabled: rangeIsValid,
    placeholderData: keepPreviousData,
  })

  const downloadMutation = useMutation({
    mutationFn: async (invoice: CfdiInvoice) => {
      setDownloadingId(invoice.id)
      const blob = await downloadSatInvoiceXml(invoice.id)
      triggerDownload(blob, `${invoice.uuidFiscal}.xml`)
    },
    onError: (err) => setDownloadError(getApiErrorMessage(err, t('invoices.downloadError'))),
    onSettled: () => setDownloadingId(null),
  })

  const invoices = data?.content ?? []

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('invoices.title')}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {t('invoices.subtitle')}
      </Typography>

      <Stack sx={{ flexDirection: 'row', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label={t('invoices.filters.type')}
          value={tipo}
          onChange={(event) => {
            setTipo(event.target.value as CfdiInvoiceType | '')
            setPage(0)
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t('invoices.filters.allTypes')}</MenuItem>
          {TYPES.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`invoices.types.${value}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          size="small"
          label={t('invoices.filters.from')}
          value={from}
          onChange={(event) => {
            setFrom(event.target.value)
            setPage(0)
          }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="date"
          size="small"
          label={t('invoices.filters.to')}
          value={to}
          onChange={(event) => {
            setTo(event.target.value)
            setPage(0)
          }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('invoices.filters.search')}
          aria-label={t('invoices.filters.search')}
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {downloadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDownloadError(null)}>
          {downloadError}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{t('invoices.loadError')}</Alert>}

      {!isLoading && !isError && invoices.length === 0 && <EmptyChartState message={t('invoices.empty')} />}

      {!isLoading && !isError && invoices.length > 0 && (
        <Paper variant="outlined">
          <TableContainer sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('invoices.columns.fechaEmision')}</TableCell>
                  <TableCell>{t('invoices.columns.tipo')}</TableCell>
                  <TableCell>{t('invoices.columns.emisor')}</TableCell>
                  <TableCell>{t('invoices.columns.receptor')}</TableCell>
                  <TableCell align="right">{t('invoices.columns.total')}</TableCell>
                  <TableCell>{t('invoices.columns.estadoSat')}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{new Date(invoice.fechaEmision).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={t(`invoices.types.${invoice.tipo}`)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.nombreEmisor ?? '—'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {invoice.rfcEmisor}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.nombreReceptor ?? '—'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {invoice.rfcReceptor}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatCurrencyIn(invoice.total, invoice.moneda)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={invoice.estadoSat === 'VIGENTE' ? 'success' : 'default'}
                        label={t(`invoices.estadoSat.${invoice.estadoSat}`)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('invoices.downloadXml')}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={t('invoices.downloadXml')}
                            disabled={downloadingId === invoice.id}
                            onClick={() => downloadMutation.mutate(invoice)}
                          >
                            {downloadingId === invoice.id ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data?.totalElements ?? 0}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={size}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={t('invoices.rowsPerPage')}
          />
        </Paper>
      )}

      {!rangeIsValid && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('connection.status.rangeSync.rangeInvalid')}
        </Alert>
      )}
    </Box>
  )
}
