import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
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

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const { register } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register(email, password, displayName)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, t('register.emailTaken')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Typography variant="h5" component="h1" gutterBottom>
        {t('register.title')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('register.displayName')}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            required
            fullWidth
          />
          <TextField
            label={t('register.email')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label={t('register.password')}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText={t('register.passwordHint')}
            autoComplete="new-password"
            required
            fullWidth
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
          <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
            {t('register.submit')}
          </Button>
          <Typography variant="body2" align="center">
            {t('register.hasAccount')}{' '}
            <Link component={RouterLink} to="/login">
              {t('register.goToLogin')}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
