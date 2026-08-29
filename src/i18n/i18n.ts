import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import common from './locales/es/common.json'
import auth from './locales/es/auth.json'
import dashboard from './locales/es/dashboard.json'

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
      es: { common, auth, dashboard },
    },
    lng: 'es',
    fallbackLng: 'es',
    ns: ['common', 'auth', 'dashboard'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

export default i18next
