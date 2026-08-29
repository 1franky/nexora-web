import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import { ThemeModeProvider } from '../theme/ThemeModeContext'
import AppThemeProvider from '../theme/AppThemeProvider'
import { queryClient } from './queryClient'
import { router } from './router'
import '../i18n/i18n'

export default function App() {
  return (
    <ThemeModeProvider>
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </AppThemeProvider>
    </ThemeModeProvider>
  )
}
