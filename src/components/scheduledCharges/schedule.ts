/**
 * Fechas de un cargo programado, espejo de ScheduleCalculator.kt en
 * nexora-api (plan-cargos-programados.md sección 2). Solo se usa para
 * *mostrar* cosas antes de guardar (fecha de inicio por defecto, «Se
 * registrarán N cargos atrasados»): quien registra los cargos es el backend.
 *
 * Funciones puras sobre fechas ISO "YYYY-MM-DD" (sin Date ni zona horaria,
 * para no correr un día por UTC). Sin imports de runtime: los tests las
 * corren directo con `node --test` (ver tests/schedule.test.ts).
 *
 * Si el mes no tiene el día configurado (31 en abril, 29-31 en febrero), el
 * cargo cae en el último día de ese mes — el día configurado no cambia: en
 * mayo vuelve al 31.
 */

export type Frequency = 'MONTHLY' | 'YEARLY'

export interface ScheduleRule {
  frequency: Frequency
  dayOfMonth: number
  /** 1-12; obligatorio si es anual, se ignora si es mensual. */
  monthOfYear: number | null
}

interface YMD {
  year: number
  month: number
  day: number
}

function parse(isoDate: string): YMD {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year, month, day }
}

function format({ year, month, day }: YMD): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function lengthOfMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function clampedDate(year: number, month: number, dayOfMonth: number): string {
  return format({ year, month, day: Math.min(dayOfMonth, lengthOfMonth(year, month)) })
}

function plusOneDay(isoDate: string): string {
  const { year, month, day } = parse(isoDate)
  if (day < lengthOfMonth(year, month)) return format({ year, month, day: day + 1 })
  if (month < 12) return format({ year, month: month + 1, day: 1 })
  return format({ year: year + 1, month: 1, day: 1 })
}

/** nexora-api rechaza cargos programados a AFORE/PPR y a cuentas archivadas. */
export function isEligibleAccount(account: { status: string; type: string }): boolean {
  return account.status === 'ACTIVE' && account.type !== 'AFORE' && account.type !== 'PPR'
}

/** Hoy en la zona del navegador, como "YYYY-MM-DD". */
export function todayIso(): string {
  const now = new Date()
  return format({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
}

/** Primera ocurrencia de la regla que cae en [date] o después. Las fechas ISO se comparan como texto. */
export function firstOnOrAfter(rule: ScheduleRule, date: string): string {
  const { year, month } = parse(date)
  if (rule.frequency === 'MONTHLY') {
    const candidate = clampedDate(year, month, rule.dayOfMonth)
    if (candidate >= date) return candidate
    return month === 12 ? clampedDate(year + 1, 1, rule.dayOfMonth) : clampedDate(year, month + 1, rule.dayOfMonth)
  }
  const ruleMonth = rule.monthOfYear ?? 1
  const candidate = clampedDate(year, ruleMonth, rule.dayOfMonth)
  return candidate >= date ? candidate : clampedDate(year + 1, ruleMonth, rule.dayOfMonth)
}

/** Siguiente ocurrencia estrictamente posterior a [date]. */
export function nextAfter(rule: ScheduleRule, date: string): string {
  return firstOnOrAfter(rule, plusOneDay(date))
}

/**
 * Cuántos cargos registraría el backend de inmediato al dar de alta con esta
 * fecha de inicio: las ocurrencias desde [startDate] hasta [today] (y hasta
 * [endDate], inclusive, si hay). 0 si la fecha de inicio es hoy o futura y
 * todavía no toca.
 */
export function countBackdatedOccurrences(
  rule: ScheduleRule,
  startDate: string,
  today: string,
  endDate: string | null = null,
): number {
  let count = 0
  let date = firstOnOrAfter(rule, startDate)
  // Tope defensivo (más de 80 años de cargos mensuales): una fecha de inicio absurda no debe colgar el navegador.
  while (date <= today && (endDate === null || date <= endDate) && count < 1000) {
    count++
    date = nextAfter(rule, date)
  }
  return count
}

/** true si entre la fecha de inicio y la de fin no cae ningún cargo (nexora-api lo rechaza con 400). */
export function hasNoOccurrenceInRange(rule: ScheduleRule, startDate: string, endDate: string): boolean {
  return firstOnOrAfter(rule, startDate) > endDate
}

/**
 * Frecuencia legible: «Cada día 15» / «Cada 3 de marzo». Recibe la función de
 * traducción y el nombre del mes para no depender de i18next aquí (se prueba
 * sin React).
 */
export function describeFrequency(
  rule: ScheduleRule,
  translate: (key: string, params: Record<string, string | number>) => string,
  monthName: (month: number) => string,
): string {
  if (rule.frequency === 'YEARLY' && rule.monthOfYear !== null) {
    return translate('frequencyLabel.YEARLY', { day: rule.dayOfMonth, month: monthName(rule.monthOfYear) })
  }
  return translate('frequencyLabel.MONTHLY', { day: rule.dayOfMonth })
}

/** "marzo" para 3, con el locale del resto de la app (es-MX). */
export function monthNameEs(month: number): string {
  return new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 1)))
}
