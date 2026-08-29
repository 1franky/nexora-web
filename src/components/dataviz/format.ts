const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Para ejes/etiquetas donde no hay espacio: $4.2K, $1.3M. */
export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value)
}

const monthLabelFormatter = new Intl.DateTimeFormat('es-MX', { month: 'short' })

/** "2026-08" -> "ago" */
export function formatMonthShort(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const label = monthLabelFormatter.format(new Date(year, month - 1, 1))
  return label.replace('.', '')
}

const monthLabelFormatterLong = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })

/** "2026-08" -> "agosto de 2026" */
export function formatMonthLong(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return monthLabelFormatterLong.format(new Date(year, month - 1, 1))
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

/** "2026-08-28" -> "28 ago" */
export function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day)).replace('.', '')
}

const currencyFormattersByCode = new Map<string, Intl.NumberFormat>()

/**
 * A diferencia de formatCurrency (fijo a MXN: el dashboard siempre agrega en
 * la moneda base), esto respeta la moneda propia de cada cuenta/movimiento
 * — necesario en cuanto hay más de una cuenta y no todas son MXN.
 */
export function formatCurrencyIn(value: number, currencyCode: string): string {
  let formatter = currencyFormattersByCode.get(currencyCode)
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: currencyCode })
    } catch {
      formatter = undefined
    }
    if (formatter) currencyFormattersByCode.set(currencyCode, formatter)
  }
  return formatter ? formatter.format(value) : `${value.toFixed(2)} ${currencyCode}`
}
