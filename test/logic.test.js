import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suggestion, weekStatus, isTimedName, isBodyweightEq } from '../js/logic.js'

const dumbbell = { n: 'Dumbbell bench press', bp: 'chest', eq: 'dumbbell' }
const legPress = { n: '45° leg press', bp: 'upper legs', eq: 'sled machine' }
const pullup = { n: 'Assisted pull-up', bp: 'back', eq: 'assisted' }
const plank = { n: 'Front plank', bp: 'waist', eq: 'body weight' }
const entry = (sets = 3, max = 12) => ({ sets: [...Array(sets)].map(() => ({})), min: 10, max })
const last = (...sets) => ({ sets: sets.map(([w, r]) => ({ w, r })) })

/* ---------------- progression ---------------- */

test('no history: nothing to suggest', () => {
  assert.deepEqual(suggestion(entry(), null, dumbbell), { sets: [], hit: false, w: null })
})

test('hit the top of the range on every set: add 2.5 kg', () => {
  const s = suggestion(entry(), last([20, 12], [20, 12], [20, 12]), dumbbell)
  assert.equal(s.hit, true)
  assert.equal(s.w, 22.5)
})

test('one set short of the top: keep the weight', () => {
  const s = suggestion(entry(), last([20, 12], [20, 12], [20, 11]), dumbbell)
  assert.equal(s.hit, false)
  assert.equal(s.w, 20)
})

test('fewer sets than planned is not a hit', () => {
  const s = suggestion(entry(3), last([20, 12], [20, 12]), dumbbell)
  assert.equal(s.hit, false)
  assert.equal(s.w, 20)
})

test('big leg machine lifts jump 5 kg', () => {
  assert.equal(suggestion(entry(), last([100, 12], [100, 12], [100, 12]), legPress).w, 105)
})

test('uses the heaviest weight of the last session as the base', () => {
  assert.equal(suggestion(entry(), last([20, 12], [25, 12], [25, 12]), dumbbell).w, 27.5)
})

test('lb users get 5 lb (10 lb for big lifts) increments, stored in kg', () => {
  const small = suggestion(entry(), last([20, 12], [20, 12], [20, 12]), dumbbell, 'lb').w
  assert.ok(Math.abs(small - (20 + 5 / 2.2046226)) < 1e-9)
  const big = suggestion(entry(), last([100, 12], [100, 12], [100, 12]), legPress, 'lb').w
  assert.ok(Math.abs(big - (100 + 10 / 2.2046226)) < 1e-9)
})

test('assisted / bodyweight exercises never get extra weight', () => {
  const s = suggestion(entry(), last([0, 12], [0, 12], [0, 12]), pullup)
  assert.equal(s.hit, true)
  assert.equal(s.w, null)
  const s2 = suggestion(entry(), last([10, 12], [10, 12], [10, 12]), pullup)
  assert.equal(s2.w, 10)
})

test('timed exercises suggest 5 more seconds once the target is hit', () => {
  const e = entry(2, 30)
  const hit = suggestion(e, last([0, 30], [0, 30]), plank)
  assert.equal(hit.r, 35)
  assert.equal(suggestion(e, last([0, 30], [0, 25]), plank).r, null)
})

test('exercise classification', () => {
  assert.ok(isTimedName('Front plank'))
  assert.ok(isTimedName('Incline treadmill walk'))
  assert.ok(!isTimedName('Dumbbell bench press'))
  assert.ok(isBodyweightEq('body weight') && isBodyweightEq('assisted'))
  assert.ok(!isBodyweightEq('dumbbell'))
})

/* ---------------- week status ---------------- */

// Mon–Fri plan like the Beginner plan (dow: 1 = Monday … 5 = Friday)
const plan = { id: 'beginner', days: [1, 2, 3, 4, 5].map(dow => ({ dow })) }
// 2026-10-12 is a Monday
const day = d => new Date(2026, 9, 12 + d, 12) // 0 = Mon … 6 = Sun
const done = (d, dayIdx, planId = 'beginner') => ({ date: `2026-10-${String(12 + d)}`, planId, dayIdx })

test('start of week: today is the first workout, nothing missed', () => {
  const st = weekStatus(plan, [], '2026-10-01', day(0))
  assert.equal(st.todayIdx, 0)
  assert.deepEqual(st.missed, [])
  assert.equal(st.nextIdx, 1)
})

test('midweek: finished days are done, skipped days are missed', () => {
  const st = weekStatus(plan, [done(0, 0), done(2, 2)], '2026-10-01', day(3)) // Thursday
  assert.deepEqual([...st.doneIdx].sort(), [0, 2])
  assert.deepEqual(st.missed, [1]) // Tuesday skipped
  assert.equal(st.todayIdx, 3)
  assert.equal(st.nextIdx, 4)
})

test('weekend is a rest day; next workout is Friday-after-weekend → Monday', () => {
  const sat = weekStatus(plan, [], '2026-10-01', day(5))
  assert.equal(sat.todayIdx, -1)
  assert.equal(sat.nextIdx, 0) // wraps to Monday
  assert.deepEqual(sat.missed, [0, 1, 2, 3, 4])
})

test('a plan chosen midweek only counts days since then as missed', () => {
  const st = weekStatus(plan, [], '2026-10-14', day(4)) // picked Wednesday, now Friday
  assert.deepEqual(st.missed, [2, 3]) // Wed, Thu — not Mon/Tue
})

test('a plan chosen today owes nothing', () => {
  assert.deepEqual(weekStatus(plan, [], '2026-10-16', day(4)).missed, [])
})

test('Sunday still belongs to the week that started on Monday', () => {
  const st = weekStatus(plan, [done(0, 0)], '2026-10-01', day(6))
  assert.equal(st.todayIdx, -1)
  assert.deepEqual([...st.doneIdx], [0])
  assert.deepEqual(st.missed, [1, 2, 3, 4])
})

test('last week and other plans do not count as done', () => {
  const old = { date: '2026-10-09', planId: 'beginner', dayIdx: 0 } // previous Friday
  const other = { date: '2026-10-12', planId: 'fb3', dayIdx: 0 }
  const st = weekStatus(plan, [old, other], '2026-10-01', day(1))
  assert.equal(st.doneIdx.size, 0)
  assert.deepEqual(st.missed, [0])
})
