import { test } from 'node:test'
import assert from 'node:assert/strict'
import { e1rm, startOfWeek, isoDate, fmtW, toDisplay, fromDisplay, fmtDuration } from '../js/util.js'

test('e1rm: Epley formula, zero for empty sets, reps capped at 20', () => {
  assert.equal(e1rm(60, 10), 80)
  assert.equal(e1rm(0, 10), 0)
  assert.equal(e1rm(60, 0), 0)
  assert.equal(e1rm(50, 30), e1rm(50, 20))
})

test('startOfWeek is the Monday, including for Sunday', () => {
  assert.equal(isoDate(startOfWeek(new Date(2026, 9, 14))), '2026-10-12') // Wed
  assert.equal(isoDate(startOfWeek(new Date(2026, 9, 18))), '2026-10-12') // Sun
  assert.equal(isoDate(startOfWeek(new Date(2026, 9, 12))), '2026-10-12') // Mon
})

test('unit conversion round-trips and formats without trailing .0', () => {
  assert.equal(fmtW(20, 'kg'), '20')
  assert.equal(fmtW(22.5, 'kg'), '22.5')
  assert.equal(fmtW(45.359237, 'lb'), '100')
  assert.ok(Math.abs(fromDisplay(toDisplay(72, 'lb'), 'lb') - 72) < 1e-9)
})

test('fmtDuration', () => {
  assert.equal(fmtDuration(65), '1:05')
  assert.equal(fmtDuration(3725), '1:02:05')
  assert.equal(fmtDuration(-5), '0:00')
})
