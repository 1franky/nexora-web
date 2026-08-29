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
import CategoriesPage from '../pages/CategoriesPage'
import NotificationsPage from '../pages/NotificationsPage'
import SettingsPage from '../pages/SettingsPage'
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
          { path: '/categories', element: <CategoriesPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
