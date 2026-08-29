import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import common from './locales/es/common.json'
import auth from './locales/es/auth.json'
import dashboard from './locales/es/dashboard.json'
import accounts from './locales/es/accounts.json'
import transactions from './locales/es/transactions.json'
import creditCards from './locales/es/creditCards.json'
import reports from './locales/es/reports.json'
import notifications from './locales/es/notifications.json'
import settings from './locales/es/settings.json'
import categories from './locales/es/categories.json'

/**
 * Solo español por ahora (plan.md, sección 17.3), con namespaces por
 * módulo para poder agregar otros idiomas más adelante sin reestructurar.
 * LanguageDetector ya queda conectado aunque hoy solo resuelva a "es".
 */
void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { common, auth, dashboard, accounts, transactions, creditCards, reports, notifications, settings, categories },
    },
    lng: 'es',
    fallbackLng: 'es',
    ns: [
      'common',
      'auth',
      'dashboard',
      'accounts',
      'transactions',
      'creditCards',
      'reports',
      'notifications',
      'settings',
      'categories',
    ],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

export default i18next
