/**
 * Lógica de fechas de cargos programados (W13). Corre con el test runner
 * nativo de Node (`npm test` → `node --test`), sin dependencias extra: Node
 * ejecuta TypeScript directamente quitando los tipos. Los casos replican
 * ScheduleCalculatorTests.kt de nexora-api para que web y backend calculen igual.
 */
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  countBackdatedOccurrences,
  describeFrequency,
  firstOnOrAfter,
  hasNoOccurrenceInRange,
  monthNameEs,
  nextAfter,
  type ScheduleRule,
} from '../src/components/scheduledCharges/schedule.ts'

const monthly = (dayOfMonth: number): ScheduleRule => ({ frequency: 'MONTHLY', dayOfMonth, monthOfYear: null })
const yearly = (dayOfMonth: number, monthOfYear: number): ScheduleRule => ({ frequency: 'YEARLY', dayOfMonth, monthOfYear })

describe('firstOnOrAfter / nextAfter (espejo de ScheduleCalculator.kt)', () => {
  test('mensual: si el día aún no pasa en el mes, cae en ese mes', () => {
    assert.equal(firstOnOrAfter(monthly(15), '2026-10-05'), '2026-10-15')
  })

  test('mensual: la misma fecha cuenta como ocurrencia', () => {
    assert.equal(firstOnOrAfter(monthly(15), '2026-10-15'), '2026-10-15')
  })

  test('mensual: si el día ya pasó, cae en el mes siguiente', () => {
    assert.equal(firstOnOrAfter(monthly(15), '2026-10-16'), '2026-11-15')
  })

  test('mensual: cruza de diciembre a enero', () => {
    assert.equal(nextAfter(monthly(15), '2026-12-15'), '2027-01-15')
  })

  test('día 31 cae en el último día de los meses cortos y vuelve al 31 después', () => {
    let date = firstOnOrAfter(monthly(31), '2027-01-01')
    const dates = [date]
    for (let i = 0; i < 4; i++) {
      date = nextAfter(monthly(31), date)
      dates.push(date)
    }
    assert.deepEqual(dates, ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31'])
  })

  test('día 30 en febrero de un año bisiesto cae el 29', () => {
    assert.equal(nextAfter(monthly(30), '2028-01-30'), '2028-02-29')
  })

  test('anual: si la fecha ya pasó este año, cae el año siguiente', () => {
    assert.equal(firstOnOrAfter(yearly(3, 3), '2026-10-05'), '2027-03-03')
  })

  test('anual: si la fecha aún no pasa este año, cae este año', () => {
    assert.equal(firstOnOrAfter(yearly(1, 12), '2026-10-05'), '2026-12-01')
  })

  test('anual: 29 de febrero cae el 28 en años no bisiestos', () => {
    assert.equal(nextAfter(yearly(29, 2), '2026-03-01'), '2027-02-28')
    assert.equal(nextAfter(yearly(29, 2), '2027-02-28'), '2028-02-29')
  })
})

describe('countBackdatedOccurrences', () => {
  test('fecha de inicio futura: ninguno', () => {
    assert.equal(countBackdatedOccurrences(monthly(15), '2026-10-15', '2026-10-05'), 0)
  })

  test('el cargo de hoy cuenta (el backend lo registra en la misma request)', () => {
    assert.equal(countBackdatedOccurrences(monthly(5), '2026-10-05', '2026-10-05'), 1)
  })

  test('mensual con inicio tres meses atrás', () => {
    // 15-jul, 15-ago, 15-sep (el 15-oct aún no toca).
    assert.equal(countBackdatedOccurrences(monthly(15), '2026-07-01', '2026-10-05'), 3)
  })

  test('respeta la fecha de fin inclusive', () => {
    assert.equal(countBackdatedOccurrences(monthly(15), '2026-07-01', '2026-10-05', '2026-08-15'), 2)
    assert.equal(countBackdatedOccurrences(monthly(15), '2026-07-01', '2026-10-05', '2026-08-14'), 1)
  })

  test('anual con inicio dos años atrás', () => {
    // 3-mar-2025 y 3-mar-2026.
    assert.equal(countBackdatedOccurrences(yearly(3, 3), '2024-10-01', '2026-10-05'), 2)
  })

  test('día 31 desde febrero cuenta el 28 de febrero', () => {
    assert.equal(countBackdatedOccurrences(monthly(31), '2027-02-01', '2027-04-29'), 2)
  })
})

describe('hasNoOccurrenceInRange', () => {
  test('sin cargo entre inicio y fin', () => {
    assert.equal(hasNoOccurrenceInRange(monthly(15), '2026-10-16', '2026-11-10'), true)
  })

  test('con un cargo justo en la fecha de fin', () => {
    assert.equal(hasNoOccurrenceInRange(monthly(15), '2026-10-16', '2026-11-15'), false)
  })
})

describe('describeFrequency', () => {
  const translate = (key: string, params: Record<string, string | number>) =>
    key === 'frequencyLabel.YEARLY' ? `Cada ${params.day} de ${params.month}` : `Cada día ${params.day}`

  test('mensual', () => {
    assert.equal(describeFrequency(monthly(15), translate, monthNameEs), 'Cada día 15')
  })

  test('anual', () => {
    assert.equal(describeFrequency(yearly(3, 3), translate, monthNameEs), 'Cada 3 de marzo')
  })
})
