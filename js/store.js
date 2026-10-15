// All app data lives in one JSON object in localStorage. iOS keeps storage for apps added to
// the home screen, but Settings → Export backup is the safety net.

const KEY = 'liftlog.v1'

const fresh = () => ({
  version: 1,
  settings: { unit: 'kg', sound: true, proteinTarget: 115, kcalTarget: 2300 },
  planId: null,
  nextDay: 0,           // index into the current plan's days
  workouts: [],         // finished sessions, newest last
  bodyweight: [],       // [{ date: 'YYYY-MM-DD', kg }]
  waist: [],            // [{ date: 'YYYY-MM-DD', cm }]
  walks: [],            // ['YYYY-MM-DD', …] rest-day walks ticked off
  food: [],             // [{ id, date, meal, name, serving, qty, kcal, p }] — kcal/p are totals
  active: null,         // the session in progress, if any
  restEnd: null         // epoch ms when the current rest timer runs out
})

let S = load()
const listeners = new Set()

function load () {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const d = JSON.parse(raw); return { ...fresh(), ...d, settings: { ...fresh().settings, ...d.settings } } }
  } catch {}
  return fresh()
}

export const state = () => S

export function save () {
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { console.error('save failed', e) }
}

// Mutate state, persist, and re-render. `quiet` persists without re-rendering — used for
// keystrokes in the workout logger so an input never loses focus mid-typing.
export function update (fn, { quiet = false } = {}) {
  fn(S)
  save()
  if (!quiet) listeners.forEach(l => l())
}

export const subscribe = fn => listeners.add(fn)

const isNum = v => typeof v === 'number' && Number.isFinite(v)
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isObj = v => v && typeof v === 'object' && !Array.isArray(v)

// Checks a backup file and returns clean state, or throws. Anything the UI would choke on
// (a workout without entries, an unknown exercise, a non-numeric weight) is rejected up front;
// minor lists are filtered. An in-progress session is not restored — it would be stale.
export function sanitizeBackup (data, isKnownEx = () => true) {
  if (!isObj(data) || !Array.isArray(data.workouts)) throw new Error('Not a LiftLog backup')
  const base = fresh()
  const workouts = data.workouts.map((w, i) => {
    const ok = isObj(w) && typeof w.id === 'string' && isDate(w.date) && isNum(w.startedAt) && isNum(w.endedAt) &&
      Array.isArray(w.entries) && w.entries.every(e => isObj(e) && isKnownEx(e.ex) && Array.isArray(e.sets) &&
        e.sets.every(s => isObj(s) && isNum(s.w) && isNum(s.r) && s.w >= 0 && s.r >= 0))
    if (!ok) throw new Error(`Workout ${i + 1} is damaged`)
    return w
  })
  const keep = (list, test) => Array.isArray(list) ? list.filter(test) : []
  return {
    ...base,
    settings: {
      unit: data.settings?.unit === 'lb' ? 'lb' : 'kg',
      sound: data.settings?.sound !== false,
      proteinTarget: isNum(data.settings?.proteinTarget) && data.settings.proteinTarget > 0 ? data.settings.proteinTarget : base.settings.proteinTarget,
      kcalTarget: isNum(data.settings?.kcalTarget) && data.settings.kcalTarget > 0 ? data.settings.kcalTarget : base.settings.kcalTarget
    },
    planId: typeof data.planId === 'string' ? data.planId : null,
    planSince: isDate(data.planSince) ? data.planSince : undefined,
    workouts,
    bodyweight: keep(data.bodyweight, b => isObj(b) && isDate(b.date) && isNum(b.kg) && b.kg > 0),
    waist: keep(data.waist, b => isObj(b) && isDate(b.date) && isNum(b.cm) && b.cm > 0),
    walks: keep(data.walks, isDate),
    food: keep(data.food, f => isObj(f) && typeof f.id === 'string' && isDate(f.date) && typeof f.name === 'string' && isNum(f.kcal) && isNum(f.p) && isNum(f.qty))
  }
}

export function replaceAll (data, isKnownEx) {
  S = sanitizeBackup(data, isKnownEx)
  save()
  listeners.forEach(l => l())
}

export function resetAll () {
  S = fresh()
  save()
  listeners.forEach(l => l())
}
