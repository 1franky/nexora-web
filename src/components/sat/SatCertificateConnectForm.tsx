import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import GppMaybeIcon from '@mui/icons-material/GppMaybe'
import { connectSatCertificate } from '../../api/satApi'
import { getApiErrorMessage } from '../../api/apiError'

export default function SatCertificateConnectForm() {
  const { t } = useTranslation('sat')
  const queryClient = useQueryClient()

  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: connectSatCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sat', 'certificate'] })
      setCerFile(null)
      setKeyFile(null)
      setPassword('')
      setError(null)
    },
    onError: (err) => setError(getApiErrorMessage(err, t('connection.form.connectError'))),
  })

  const canSubmit = cerFile !== null && keyFile !== null && password.trim() !== ''

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!cerFile || !keyFile || !canSubmit) return
    setError(null)
    mutation.mutate({ cer: cerFile, key: keyFile, password })
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <Alert severity="warning" icon={<GppMaybeIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t('connection.consent.title')}
          </Typography>
          <Typography variant="body2">{t('connection.consent.body')}</Typography>
        </Alert>

        {error && <Alert severity="error">{error}</Alert>}

        <FileField
          label={t('connection.form.cerLabel')}
          accept=".cer"
          file={cerFile}
          onChange={setCerFile}
        />
        <FileField
          label={t('connection.form.keyLabel')}
          accept=".key"
          file={keyFile}
          onChange={setKeyFile}
        />
        <TextField
          type="password"
          label={t('connection.form.passwordLabel')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          fullWidth
          autoComplete="off"
        />

        <Box>
          <Button type="submit" variant="contained" loading={mutation.isPending} disabled={!canSubmit}>
            {t('connection.form.connect')}
          </Button>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
            {t('connection.form.connectHint')}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

function FileField({
  label,
  accept,
  file,
  onChange,
}: {
  label: string
  accept: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  const { t } = useTranslation('sat')
  return (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ flexShrink: 0 }}>
        {label}
        <input
          type="file"
          accept={accept}
          hidden
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </Button>
      <Typography variant="body2" sx={{ color: file ? 'text.primary' : 'text.secondary' }} noWrap>
        {file ? file.name : t('connection.form.noFileChosen')}
      </Typography>
    </Stack>
  )
}
