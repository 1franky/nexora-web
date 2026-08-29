export type WidgetId =
  | 'netWorth'
  | 'availableBalance'
  | 'creditCardDebt'
  | 'availableCredit'
  | 'incomeThisMonth'
  | 'expenseThisMonth'
  | 'monthlyBalance'
  | 'expensesByCategory'
  | 'incomeByCategory'
  | 'netWorthEvolution'
  | 'expenseEvolution'
  | 'upcomingPayments'
  | 'recentTransactions'

export interface WidgetDefinition {
  id: WidgetId
  /** Clave de traducción en el namespace "dashboard" — solo para el diálogo de personalización (cada widget ya rotula su propio título al renderizarse). */
  titleKey: string
  size: 'quarter' | 'half'
}

/**
 * Catálogo de widgets del dashboard (plan.md, sección 10). El orden de este
 * arreglo es el layout por defecto para un usuario nuevo (y coincide con el
 * layout fijo que tenía el dashboard antes de W7). "Ahorro mensual", "Metas
 * de ahorro" y "AFORE" (también listados en el plan como widgets) quedan
 * fuera: el backend todavía no calcula esos datos, no hay nada que mostrar.
 */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: 'netWorth', titleKey: 'netWorth', size: 'quarter' },
  { id: 'availableBalance', titleKey: 'availableBalance', size: 'quarter' },
  { id: 'creditCardDebt', titleKey: 'creditCardDebt', size: 'quarter' },
  { id: 'availableCredit', titleKey: 'availableCredit', size: 'quarter' },
  { id: 'incomeThisMonth', titleKey: 'monthSummary.incomeThisMonth', size: 'quarter' },
  { id: 'expenseThisMonth', titleKey: 'monthSummary.expenseThisMonth', size: 'quarter' },
  { id: 'monthlyBalance', titleKey: 'monthSummary.monthlyBalance', size: 'quarter' },
  { id: 'expensesByCategory', titleKey: 'monthSummary.expensesByCategory', size: 'half' },
  { id: 'incomeByCategory', titleKey: 'monthSummary.incomeByCategory', size: 'half' },
  { id: 'netWorthEvolution', titleKey: 'trends.netWorthEvolution', size: 'half' },
  { id: 'expenseEvolution', titleKey: 'trends.expenseEvolution', size: 'half' },
  { id: 'upcomingPayments', titleKey: 'creditCards.upcomingPayments', size: 'half' },
  { id: 'recentTransactions', titleKey: 'recentTransactions.heading', size: 'half' },
]

export const WIDGET_IDS: WidgetId[] = WIDGET_DEFINITIONS.map((w) => w.id)

export const WIDGET_BY_ID: Record<WidgetId, WidgetDefinition> = Object.fromEntries(
  WIDGET_DEFINITIONS.map((w) => [w.id, w]),
) as Record<WidgetId, WidgetDefinition>
