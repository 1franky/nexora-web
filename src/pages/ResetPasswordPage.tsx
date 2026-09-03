import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { resetPassword } from '../api/authApi'
import { getApiErrorMessage } from '../api/apiError'
import AuthLayout from '../layout/AuthLayout'

/** Cuánto se muestra el mensaje de éxito antes de volver a Login. */
const SUCCESS_REDIRECT_DELAY_MS = 1500

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState((location.state as { email?: string })?.email ?? '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'))
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(email, code, newPassword)
      setSuccess(true)
      // El backend revoca todas las sesiones activas del usuario tras el
      // reset — no hay nada que limpiar del lado del cliente, solo llevarlo
      // de nuevo a Login para que inicie sesión con la contraseña nueva.
      setTimeout(() => {
        navigate('/login', { replace: true, state: { passwordResetSuccess: true } })
      }, SUCCESS_REDIRECT_DELAY_MS)
    } catch (err) {
      setError(getApiErrorMessage(err, t('resetPassword.invalidCode')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('resetPassword.title')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {success && <Alert severity="success">{t('resetPassword.success')}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('resetPassword.email')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            fullWidth
            disabled={success}
          />
          <TextField
            label={t('resetPassword.code')}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            required
            fullWidth
            disabled={success}
            slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '\\d{6}', maxLength: 6 } }}
          />
          <TextField
            label={t('resetPassword.newPassword')}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText={t('resetPassword.passwordHint')}
            autoComplete="new-password"
            required
            fullWidth
            disabled={success}
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
          <TextField
            label={t('resetPassword.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            fullWidth
            disabled={success}
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
          <Button type="submit" variant="contained" size="large" loading={isSubmitting} disabled={success} fullWidth>
            {t('resetPassword.submit')}
          </Button>
          <Typography variant="body2" align="center">
            <Link component={RouterLink} to="/forgot-password">
              {t('resetPassword.requestNewCode')}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
