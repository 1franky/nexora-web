import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '../auth/RequireAuth'
import AppLayout from '../layout/AppLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import HomePage from '../pages/HomePage'
import ComingSoonPage from '../pages/ComingSoonPage'
import NotFoundPage from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/accounts', element: <ComingSoonPage title="Cuentas" /> },
          { path: '/transactions', element: <ComingSoonPage title="Movimientos" /> },
          { path: '/credit-cards', element: <ComingSoonPage title="Tarjetas" /> },
          { path: '/categories', element: <ComingSoonPage title="Categorías" /> },
          { path: '/notifications', element: <ComingSoonPage title="Notificaciones" /> },
          { path: '/settings', element: <ComingSoonPage title="Configuración" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
