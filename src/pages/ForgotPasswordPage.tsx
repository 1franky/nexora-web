import { useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { forgotPassword } from '../api/authApi'
import { getApiErrorMessage } from '../api/apiError'
import AuthLayout from '../layout/AuthLayout'

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      // La respuesta siempre es 200 con cuerpo vacío, exista o no el email
      // (nunca revela si una cuenta existe) — el mensaje que se muestra es
      // fijo en el frontend, no depende de lo que devuelva el backend.
      await forgotPassword(email)
      setSubmitted(true)
    } catch (err) {
      setError(getApiErrorMessage(err, t('forgotPassword.error')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('forgotPassword.title')}
      </Typography>
      {submitted ? (
        <Stack spacing={2}>
          <Alert severity="success">{t('forgotPassword.success')}</Alert>
          <Button
            component={RouterLink}
            to="/reset-password"
            state={{ email }}
            variant="contained"
            size="large"
            fullWidth
          >
            {t('forgotPassword.continue')}
          </Button>
          <Typography variant="body2" align="center">
            <Link component={RouterLink} to="/login">
              {t('forgotPassword.backToLogin')}
            </Link>
          </Typography>
        </Stack>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t('forgotPassword.email')}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
              {t('forgotPassword.submit')}
            </Button>
            <Typography variant="body2" align="center">
              <Link component={RouterLink} to="/login">
                {t('forgotPassword.backToLogin')}
              </Link>
            </Typography>
          </Stack>
        </Box>
      )}
    </AuthLayout>
  )
}
