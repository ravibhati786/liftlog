// All app data lives in one JSON object in localStorage. iOS keeps storage for apps added to
// the home screen, but Settings → Export backup is the safety net.

const KEY = 'liftlog.v1'

const fresh = () => ({
  version: 1,
  settings: { unit: 'kg', sound: true },
  planId: null,
  nextDay: 0,           // index into the current plan's days
  workouts: [],         // finished sessions, newest last
  bodyweight: [],       // [{ date: 'YYYY-MM-DD', kg }]
  active: null,         // the session in progress, if any
  restEnd: null         // epoch ms when the current rest timer runs out
})

let S = load()
const listeners = new Set()

function load () {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw) }
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

export function replaceAll (data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.workouts)) throw new Error('Not a LiftLog backup')
  S = { ...fresh(), ...data }
  save()
  listeners.forEach(l => l())
}

export function resetAll () {
  S = fresh()
  save()
  listeners.forEach(l => l())
}
