import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '../auth/RequireAuth'
import AppLayout from '../layout/AppLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import AccountsPage from '../pages/AccountsPage'
import TransactionsPage from '../pages/TransactionsPage'
import CreditCardsPage from '../pages/CreditCardsPage'
import CreditCardDetailPage from '../pages/CreditCardDetailPage'
import ReportsPage from '../pages/ReportsPage'
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
          { path: '/', element: <DashboardPage /> },
          { path: '/accounts', element: <AccountsPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/credit-cards', element: <CreditCardsPage /> },
          { path: '/credit-cards/:id', element: <CreditCardDetailPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/categories', element: <ComingSoonPage title="Categorías" /> },
          { path: '/notifications', element: <ComingSoonPage title="Notificaciones" /> },
          { path: '/settings', element: <ComingSoonPage title="Configuración" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
