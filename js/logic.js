// Pure training logic (no DOM, no storage) so it can be unit-tested: npm test.
import { isoDate, startOfWeek } from './util.js'

const LB = 2.2046226
const TIMED_RE = /plank|hold|farmers walk|treadmill|^run|battling ropes|mountain climber|jump rope|stationary bike|elliptical|stepmill|skierg|ergometer|wall sit/i
export const isTimedName = name => TIMED_RE.test(name || '')
export const isBodyweightEq = eq => ['body weight', 'assisted', 'rope'].includes(eq)

const BIG_EQ = ['barbell', 'sled machine', 'leverage machine', 'smith machine', 'trap bar']

// Double progression: once every set reached the top of the rep range, add weight.
// `last` is the previous session of this exercise ({ sets: [{ w, r }] }) or null.
// `ex` is the exercise record ({ n, bp, eq }); weights are kg internally.
export function suggestion (entry, last, ex, unit = 'kg') {
  if (!last) return { sets: [], hit: false, w: null }
  const prev = last.sets
  const top = Math.max(0, ...prev.map(s => s.w || 0))
  const hit = prev.length >= entry.sets.length && prev.every(s => (s.r || 0) >= entry.max)
  const big = !!ex && ex.bp === 'upper legs' && BIG_EQ.includes(ex.eq)
  const inc = unit === 'lb' ? (big ? 10 : 5) / LB : (big ? 5 : 2.5)
  if (isTimedName(ex?.n)) return { sets: prev, hit, w: top || null, r: hit ? entry.max + 5 : null }
  return { sets: prev, hit, w: top ? (hit && !isBodyweightEq(ex?.eq) ? top + inc : top) : null }
}

const ord = dow => (dow + 6) % 7 // Monday = 0 … Sunday = 6

// Where you are in this week's plan: today's workout, what's done, what was missed, what's next.
// `now` is a Date; `planSince` an ISO date (days before it can't be "missed").
export function weekStatus (plan, workouts, planSince, now = new Date()) {
  const dow = now.getDay()
  const monday = startOfWeek(now)
  const from = isoDate(monday)
  const week = workouts.filter(w => w.date >= from)
  const doneIdx = new Set(week.filter(w => w.planId === plan.id).map(w => w.dayIdx))
  const todayIdx = plan.days.findIndex(d => d.dow === dow)
  const since = planSince || isoDate(now)
  const dateOf = d => { const x = new Date(monday); x.setDate(x.getDate() + ord(d.dow)); return isoDate(x) }
  const missed = plan.days.map((_, i) => i).filter(i => ord(plan.days[i].dow) < ord(dow) && !doneIdx.has(i) && dateOf(plan.days[i]) >= since)
  let nextIdx = plan.days.findIndex(d => ord(d.dow) > ord(dow))
  if (nextIdx < 0) nextIdx = 0
  return { dow, week, doneIdx, todayIdx, missed, nextIdx }
}
