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
import { useAuth } from '../auth/AuthContext'
import { getApiErrorMessage } from '../api/apiError'
import AuthLayout from '../layout/AuthLayout'

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { passwordResetSuccess?: boolean })?.passwordResetSuccess ? t('resetPassword.success') : null,
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, t('login.invalidCredentials')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('login.title')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('login.email')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            fullWidth
          />
          <Typography variant="body2" align="right">
            <Link component={RouterLink} to="/forgot-password">
              {t('login.forgotPassword')}
            </Link>
          </Typography>
          <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
            {t('login.submit')}
          </Button>
          <Typography variant="body2" align="center">
            {t('login.noAccount')}{' '}
            <Link component={RouterLink} to="/register">
              {t('login.createAccount')}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
