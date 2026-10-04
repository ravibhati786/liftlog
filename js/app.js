import { EXERCISES } from './exercises.js'
import { PLANS, planById, WARMUPS, DAY_NAMES, BEGINNER_TIPS } from './plans.js'
import { state, update, subscribe, replaceAll, resetAll } from './store.js'
import {
  h, svgIcon, todayISO, isoDate, parseISO, fmtDate, startOfWeek, fmtDuration, fmtMinutes,
  toDisplay, fromDisplay, fmtW, e1rm, lineChart, uid
} from './util.js'

/* ================================ exercise helpers ================================ */

// "Lever" is the dataset's word for a weight-stack machine; "Machine" is what a beginner sees.
for (const e of EXERCISES) e.n = e.n.replace(/^Lever /, 'Machine ').replace(/^Low glute bridge on floor$/, 'Glute bridge')
const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]))
const GIF_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/'
const gifSrc = ex => GIF_BASE + ex.gif

const TIMED_RE = /plank|hold|farmers walk|treadmill|^run|battling ropes|mountain climber|jump rope|stationary bike|elliptical|stepmill|skierg|ergometer|wall sit/i
const isTimed = id => TIMED_RE.test(EX[id]?.n || '')
const isBodyweight = id => ['body weight', 'assisted', 'rope'].includes(EX[id]?.eq)

const GROUPS = {
  Chest: ['pectorals'],
  Back: ['lats', 'upper back', 'spine'],
  Shoulders: ['delts', 'traps'],
  Arms: ['biceps', 'triceps', 'forearms'],
  Legs: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  Core: ['abs', 'serratus anterior'],
  Cardio: ['cardiovascular system']
}
const groupOf = tg => Object.keys(GROUPS).find(g => GROUPS[g].includes(tg)) || 'Other'
const secs = r => r >= 120 ? `${Math.round(r / 60)} min` : `${r}s`
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

/* ================================ history queries ================================ */

// Every finished session of an exercise, oldest first: [{ date, startedAt, sets }]
function sessionsOf (exId) {
  const out = []
  for (const w of state().workouts) {
    for (const e of w.entries) if (e.ex === exId && e.sets.length) out.push({ date: w.date, startedAt: w.startedAt, sets: e.sets, workoutId: w.id })
  }
  return out
}
const lastSession = exId => sessionsOf(exId).at(-1) || null

// A single number that says "how good was this set": e1RM for weighted work, seconds/reps otherwise.
function setScore (exId, s) {
  if (isTimed(exId)) return s.r || 0
  if (s.w > 0) return e1rm(s.w, s.r)
  return s.r || 0
}
function bestOf (exId, sessions = sessionsOf(exId)) {
  let best = 0
  for (const x of sessions) for (const s of x.sets) best = Math.max(best, setScore(exId, s))
  return best
}

// Double progression: once every set reached the top of the rep range, add weight.
function suggestion (entry) {
  const last = lastSession(entry.ex)
  if (!last) return { sets: [], hit: false, w: null }
  const prev = last.sets
  const top = Math.max(0, ...prev.map(s => s.w || 0))
  const hit = prev.length >= entry.sets.length && prev.every(s => (s.r || 0) >= entry.max)
  const ex = EX[entry.ex]
  const unit = state().settings.unit
  const big = ex && ['upper legs'].includes(ex.bp) && ['barbell', 'sled machine', 'leverage machine', 'smith machine', 'trap bar'].includes(ex.eq)
  const inc = unit === 'lb' ? fromDisplay(big ? 10 : 5, 'lb') : (big ? 5 : 2.5)
  if (isTimed(entry.ex)) return { sets: prev, hit, w: top || null, r: hit ? entry.max + 5 : null }
  return { sets: prev, hit, w: top ? (hit && !isBodyweight(entry.ex) ? top + inc : top) : null }
}

/* ================================ UI state ================================ */

const ui = {
  tab: 'today',
  libQuery: '',
  libGroup: 'All',
  liftId: null,
  sheets: []
}
const $app = document.getElementById('app')
const $sheets = document.getElementById('sheets')

function render () {
  const S = state()
  const inWorkout = !!S.active
  const y = window.scrollY
  $app.replaceChildren(...(inWorkout ? [WorkoutScreen()] : [h('main', { class: 'screen' }, SCREENS[ui.tab]()), TabBar()]))
  document.body.classList.toggle('in-workout', inWorkout)
  window.scrollTo(0, y)
  tick()
}
subscribe(render)

const SCREENS = { today: TodayScreen, plans: PlansScreen, progress: ProgressScreen, library: LibraryScreen }

function TabBar () {
  const tabs = [['today', 'Today'], ['plans', 'Plans'], ['progress', 'Progress'], ['library', 'Exercises']]
  return h('nav', { class: 'tabbar' }, tabs.map(([id, label]) =>
    h('button', { class: 'tab' + (ui.tab === id ? ' on' : ''), onclick: () => { ui.tab = id; window.scrollTo(0, 0); render() } },
      svgIcon(id === 'library' ? 'library' : id), h('span', null, label))))
}

/* ================================ sheets (modals) ================================ */

function openSheet (build, { full = false } = {}) {
  const close = () => {
    const i = ui.sheets.indexOf(entry)
    if (i >= 0) ui.sheets.splice(i, 1)
    wrap.classList.add('closing')
    setTimeout(() => wrap.remove(), 220)
    if (!ui.sheets.length) document.body.classList.remove('sheet-open')
  }
  const body = h('div', { class: 'sheet-body' })
  const panel = h('div', { class: 'sheet' + (full ? ' full' : '') },
    h('div', { class: 'sheet-grab' }),
    h('button', { class: 'sheet-x icon-btn', 'aria-label': 'Close', onclick: close }, svgIcon('x')),
    body)
  const wrap = h('div', { class: 'sheet-wrap' }, h('div', { class: 'scrim', onclick: close }), panel)
  const refresh = () => body.replaceChildren(build(close, refresh))
  const entry = { close, refresh }
  refresh()
  ui.sheets.push(entry)
  $sheets.append(wrap)
  document.body.classList.add('sheet-open')
  return entry
}

function toast (msg) {
  const t = h('div', { class: 'toast' }, msg)
  document.body.append(t)
  setTimeout(() => t.classList.add('show'), 10)
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300) }, 2400)
}

/* ================================ TODAY ================================ */

function greeting () {
  const hr = new Date().getHours()
  return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'
}

const WARMUP_MIN = 8
const SHORT_DAY = d => DAY_NAMES[d].slice(0, 3)
const ord = dow => (dow + 6) % 7 // Monday = 0 … Sunday = 6

// Where you are in this week's plan: today's workout, what's done, what was missed, what's next.
function weekStatus (plan) {
  const S = state()
  const dow = new Date().getDay()
  const from = isoDate(startOfWeek())
  const week = S.workouts.filter(w => w.date >= from)
  const doneIdx = new Set(week.filter(w => w.planId === plan.id).map(w => w.dayIdx))
  const todayIdx = plan.days.findIndex(d => d.dow === dow)
  // Only days since you picked the plan can be "missed" — a plan chosen on Sunday owes nothing.
  const since = S.planSince || todayISO()
  const dateOf = d => { const x = startOfWeek(); x.setDate(x.getDate() + ord(d.dow)); return isoDate(x) }
  const missed = plan.days.map((_, i) => i).filter(i => ord(plan.days[i].dow) < ord(dow) && !doneIdx.has(i) && dateOf(plan.days[i]) >= since)
  let nextIdx = plan.days.findIndex(d => ord(d.dow) > ord(dow))
  if (nextIdx < 0) nextIdx = 0
  return { dow, week, doneIdx, todayIdx, missed, nextIdx }
}

function WeekStrip (plan) {
  const start = startOfWeek()
  const done = new Set(state().workouts.map(w => w.date))
  const planned = new Set(plan.days.map(d => d.dow))
  const today = todayISO()
  return h('div', { class: 'week' }, [...Array(7)].map((_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i)
    const iso = isoDate(d)
    const isPlanned = planned.has(d.getDay())
    return h('div', { class: 'wday' + (done.has(iso) ? ' done' : '') + (iso === today ? ' today' : '') + (isPlanned ? ' planned' : '') },
      h('span', { class: 'wl' }, 'MTWTFSS'[i]),
      h('span', { class: 'wd' }, done.has(iso) ? svgIcon('check', 'ico sm') : d.getDate()),
      h('span', { class: 'wdot' }))
  }))
}

// Rough session length: ~3 s per rep (or the timed seconds) plus rest, plus the warm-up.
const estMinutes = day => WARMUP_MIN + Math.round(day.ex.reduce((t, e) => t + e.sets * ((isTimed(e.id) ? e.max : e.max * 3) + e.rest), 0) / 60 / 5) * 5

function WorkoutCard (plan, i, label, { primary = true, cta = 'Start workout' } = {}) {
  const day = plan.days[i]
  return h('section', { class: 'card next' },
    h('div', { class: 'label accent' }, label),
    h('h2', null, day.name),
    h('p', { class: 'muted' }, `${day.focus} · ~${estMinutes(day)} min`),
    h('ol', { class: 'ex-preview' },
      h('li', { class: 'wu-li', onclick: () => planDaySheet(plan, i) }, h('span', null, 'Warm-up'), h('span', { class: 'muted nowrap' }, `${WARMUP_MIN} min`)),
      day.ex.map(e => h('li', { onclick: () => exerciseSheet(e.id) },
        h('span', null, EX[e.id].n), h('span', { class: 'muted nowrap' }, `${e.sets} × ${repText(e)}`)))),
    h('button', { class: 'btn block' + (primary ? ' primary' : ''), onclick: () => startWorkout(plan.id, i) }, cta))
}

const repText = e => isTimed(e.id)
  ? (e.max >= 120 ? `${Math.round(e.min / 60)}–${Math.round(e.max / 60)} min` : `${e.min}–${e.max}s`)
  : `${e.min}–${e.max}`

function TodayScreen () {
  const S = state()
  const plan = planById(S.planId)
  const header = h('header', { class: 'top' },
    h('div', null, h('div', { class: 'eyebrow' }, fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })), h('h1', null, greeting())),
    h('button', { class: 'icon-btn', 'aria-label': 'Settings', onclick: settingsSheet }, svgIcon('gear')))

  if (!plan) {
    return [header,
      h('section', { class: 'card hero' },
        h('h2', null, 'Pick your training plan'),
        h('p', { class: 'muted' }, 'New to the gym? Start with the Beginner plan — it’s marked “Recommended”. Each workout is set for a fixed day of the week, so you just open the app at the gym and press Start.')),
      BeginnerTipsCard(),
      PlanList()]
  }

  const st = weekStatus(plan)
  const target = plan.days.length
  const doneCount = st.doneIdx.size
  const next = plan.days[st.nextIdx]
  const nextLabel = `Next · ${DAY_NAMES[next.dow]}`

  let main
  if (st.todayIdx >= 0 && !st.doneIdx.has(st.todayIdx)) {
    main = WorkoutCard(plan, st.todayIdx, `Today · ${DAY_NAMES[st.dow]}`)
  } else if (st.todayIdx >= 0) {
    main = [h('section', { class: 'card done-card' }, h('div', { class: 'big' }, '✅'), h('h2', null, 'Today’s workout is done'), h('p', { class: 'muted' }, 'Great job! Eat well, drink water and get a good night’s sleep — that’s when your body gets stronger.')),
      WorkoutCard(plan, st.nextIdx, nextLabel, { primary: false, cta: 'Start early' })]
  } else {
    main = [h('section', { class: 'card done-card' }, h('div', { class: 'big' }, '😴'), h('h2', null, 'Rest day'), h('p', { class: 'muted' }, 'Recovery is when your muscles grow. A walk or some light stretching is perfect today.')),
      WorkoutCard(plan, st.nextIdx, nextLabel, { primary: false, cta: 'Train anyway' })]
  }

  return [header,
    h('section', { class: 'card' },
      h('div', { class: 'row between' },
        h('div', null, h('div', { class: 'label' }, 'This week'), h('div', { class: 'big' }, `${doneCount}`, h('span', { class: 'muted' }, ` / ${target} workouts`))),
        h('div', { class: 'ring', style: `--p:${Math.min(1, doneCount / target)}` }, h('span', null, Math.round(Math.min(1, doneCount / target) * 100) + '%'))),
      WeekStrip(plan)),

    main,

    st.missed.length ? h('section', null,
      h('div', { class: 'section-title' }, st.todayIdx >= 0 ? 'Missed this week' : 'Missed this week — catch up today?'),
      h('div', { class: 'day-chips' }, st.missed.map(i => DayChip(plan, i, st)))) : null,

    h('section', null,
      h('div', { class: 'section-title' }, `Your week · ${plan.short}`),
      h('div', { class: 'day-chips' }, plan.days.map((_, i) => DayChip(plan, i, st)))),

    S.workouts.length < 10 ? BeginnerTipsCard() : null,
    LastWorkoutCard()]
}

function DayChip (plan, i, st) {
  const d = plan.days[i]
  return h('button', { class: 'day-chip' + (i === st.todayIdx ? ' on' : ''), onclick: () => planDaySheet(plan, i) },
    h('span', { class: 'dn' }, DAY_NAMES[d.dow]), h('span', null, d.name),
    st.doneIdx.has(i) ? svgIcon('check', 'ico sm ok') : null)
}

function BeginnerTipsCard () {
  return h('section', { class: 'card tap tips-card', onclick: tipsSheet },
    h('div', { class: 'row gap' }, h('div', { class: 'big' }, '💡'),
      h('div', { class: 'grow' }, h('strong', null, 'New to the gym?'), h('div', { class: 'muted small' }, '9 quick tips for your first weeks — 2 minute read')),
      svgIcon('chev', 'ico muted')))
}

function tipsSheet () {
  openSheet(() => h('div', null,
    h('h2', null, 'New to the gym?'),
    h('p', { class: 'muted' }, 'Everyone starts somewhere. These basics will keep you safe and help you improve week after week.'),
    BEGINNER_TIPS.map(([t, d], i) => h('div', { class: 'card flat tip-item' }, h('div', { class: 'tip-n' }, i + 1), h('div', null, h('strong', null, t), h('div', { class: 'muted small' }, d))))), { full: true })
}

function LastWorkoutCard () {
  const w = state().workouts.at(-1)
  if (!w) return null
  const sets = w.entries.reduce((n, e) => n + e.sets.length, 0)
  return h('section', null,
    h('div', { class: 'section-title' }, 'Last workout'),
    h('div', { class: 'card tap', onclick: () => workoutDetailSheet(w.id) },
      h('div', { class: 'row between' },
        h('div', null, h('strong', null, w.name), h('div', { class: 'muted small' }, `${fmtDate(parseISO(w.date))} · ${fmtMinutes((w.endedAt - w.startedAt) / 1000)} · ${sets} sets`)),
        svgIcon('chev'))))
}

/* ================================ PLANS ================================ */

function PlansScreen () {
  return [
    h('header', { class: 'top' }, h('div', null, h('div', { class: 'eyebrow' }, 'Programs'), h('h1', null, 'Plans'))),
    h('p', { class: 'muted intro' }, 'All plans are for a full gym and listed from easiest to hardest. Tap one to see every workout, then choose “Use this plan”. You can switch any time — your history is kept.'),
    PlanList()
  ]
}

function PlanList () {
  const S = state()
  return h('div', { class: 'plan-list' }, PLANS.map(p => h('div', { class: 'card plan tap' + (p.id === S.planId ? ' current' : '') + (p.recommended ? ' recommended' : ''), onclick: () => planSheet(p) },
    h('div', { class: 'row gap' },
      p.recommended ? h('span', { class: 'pill accent' }, '★ Recommended for beginners') : null,
      h('span', { class: 'pill' }, `${p.days.length} days / week`),
      p.id === S.planId ? h('span', { class: 'pill ok' }, 'Current plan') : null),
    h('h3', null, p.name),
    h('p', { class: 'muted small' }, p.about),
    h('div', { class: 'plan-days' }, p.days.map(d => h('span', null, h('b', null, SHORT_DAY(d.dow)), ` ${d.name}`))),
    h('div', { class: 'muted small' }, `Level: ${p.level} · ${p.schedule}`))))
}

function WarmupList (key) {
  return h('ul', { class: 'wu-list' }, WARMUPS[key].map(w => h('li', { class: w.id ? 'tap' : null, onclick: w.id ? () => exerciseSheet(w.id) : null },
    h('div', { class: 'grow' }, h('div', null, w.t), h('div', { class: 'muted small' }, w.d)),
    w.id ? svgIcon('info', 'ico muted') : null)))
}

function planSheet (p) {
  openSheet(close => h('div', null,
    h('span', { class: 'pill' + (p.recommended ? ' accent' : '') }, `${p.days.length} days / week · ${p.level}`),
    h('h2', null, p.name),
    h('p', { class: 'muted' }, p.about),
    h('p', { class: 'small muted' }, `Schedule: ${p.schedule}. Every workout starts with an ${WARMUP_MIN}-minute warm-up. Missed a day? Just do today’s workout, or catch up at the weekend.`),
    p.recommended ? h('button', { class: 'menu-item', onclick: tipsSheet }, '💡 New to the gym? Read the tips first') : null,
    p.days.map((d, i) => h('div', { class: 'card flat' },
      h('div', { class: 'label' }, `${DAY_NAMES[d.dow]} · ~${estMinutes(d)} min`),
      h('h3', null, d.name),
      h('div', { class: 'muted small' }, d.focus),
      ExerciseRows(d.ex))),
    h('div', { class: 'sticky-cta' },
      state().planId === p.id
        ? h('button', { class: 'btn block', onclick: close }, 'This is your current plan')
        : h('button', {
          class: 'btn primary block',
          onclick: () => {
            update(S => { S.planId = p.id; S.planSince = todayISO() })
            close(); ui.tab = 'today'; render(); toast(`${p.short} plan selected`)
          }
        }, 'Use this plan'))), { full: true })
}

function ExerciseRows (list) {
  return h('ul', { class: 'ex-rows' }, list.map(e => h('li', { class: 'tap', onclick: () => exerciseSheet(e.id) },
    h('img', { class: 'thumb', loading: 'lazy', src: gifSrc(EX[e.id]), alt: '' }),
    h('div', { class: 'grow' }, h('div', null, EX[e.id].n), h('div', { class: 'muted small' }, `${e.sets} ${e.sets === 1 ? 'set' : 'sets'} × ${repText(e)}${isTimed(e.id) ? '' : ' reps'} · rest ${e.rest ? e.rest + 's' : '—'}`)),
    svgIcon('info', 'ico muted'))))
}

function planDaySheet (plan, i) {
  const d = plan.days[i]
  openSheet(close => h('div', null,
    h('div', { class: 'label' }, `${plan.short} · ${DAY_NAMES[d.dow]}`),
    h('h2', null, d.name),
    h('p', { class: 'muted' }, `${d.focus} · ~${estMinutes(d)} min`),
    h('div', { class: 'section-title' }, `1. Warm-up · ${WARMUP_MIN} min`),
    WarmupList(d.wu),
    h('div', { class: 'section-title' }, '2. Workout'),
    ExerciseRows(d.ex),
    h('div', { class: 'sticky-cta' }, h('button', { class: 'btn primary block', onclick: () => { close(); startWorkout(plan.id, i) } }, 'Start this workout'))), { full: true })
}

/* ================================ WORKOUT SESSION ================================ */

function newEntry (exId, sets = 3, min = 8, max = 12, rest = 90) {
  return { key: uid(), ex: exId, min, max, rest, sets: [...Array(sets)].map(() => ({ w: null, r: null, done: false })) }
}

function startWorkout (planId, dayIdx) {
  const plan = planById(planId)
  const day = plan?.days[dayIdx]
  update(S => {
    S.active = {
      id: uid(),
      planId: plan ? plan.id : null,
      dayIdx: plan ? dayIdx : null,
      name: day ? day.name : 'Custom workout',
      wu: day ? day.wu : 'full',
      warm: [],
      warmOpen: true,
      startedAt: Date.now(),
      entries: day ? day.ex.map(e => newEntry(e.id, e.sets, e.min, e.max, e.rest)) : []
    }
    S.restEnd = null
  })
  window.scrollTo(0, 0)
  keepAwake(true)
}

function WorkoutScreen () {
  const S = state()
  const A = S.active
  const unit = S.settings.unit
  const doneSets = A.entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)
  const totalSets = A.entries.reduce((n, e) => n + e.sets.length, 0)

  return h('main', { class: 'screen workout' },
    h('header', { class: 'wk-top' },
      h('button', { class: 'icon-btn', 'aria-label': 'Workout options', onclick: workoutMenu }, svgIcon('more')),
      h('div', { class: 'wk-title' }, h('div', { class: 'strong' }, A.name), h('div', { class: 'muted small' }, h('span', { 'data-tick': 'elapsed' }, fmtDuration((Date.now() - A.startedAt) / 1000)), ` · ${doneSets}/${totalSets} sets`)),
      h('button', { class: 'btn primary sm', onclick: finishWorkout }, 'Finish')),
    h('div', { class: 'progress-bar' }, h('span', { style: `width:${totalSets ? doneSets / totalSets * 100 : 0}%` })),
    WarmupCard(A),
    A.entries.map((e, i) => EntryCard(e, i, unit, i === firstWeighted(A))),
    h('button', { class: 'btn ghost block', onclick: () => exercisePicker({ title: 'Add exercise', onPick: id => update(S => S.active.entries.push(newEntry(id))) }) }, svgIcon('plus'), 'Add exercise'),
    h('button', { class: 'btn primary block', onclick: finishWorkout }, 'Finish workout'),
    h('div', { class: 'rest-spacer' }),
    RestBar())
}

const firstWeighted = A => A.entries.findIndex(e => !isTimed(e.ex) && !isBodyweight(e.ex))

// The warm-up checklist at the top of a session. Folds away once everything is ticked.
function WarmupCard (A) {
  const items = WARMUPS[A.wu]
  if (!items) return null
  const done = items.filter((_, i) => A.warm[i]).length
  const all = done === items.length
  const toggleOpen = () => update(S => { S.active.warmOpen = !S.active.warmOpen })
  if (!A.warmOpen) {
    return h('section', { class: 'card wu-card folded tap', onclick: toggleOpen },
      h('div', { class: 'row gap' }, h('span', { class: 'wu-badge' + (all ? ' ok' : '') }, all ? svgIcon('check', 'ico sm') : '🔥'),
        h('div', { class: 'grow' }, h('strong', null, all ? 'Warm-up done' : 'Warm-up'), h('div', { class: 'muted small' }, all ? 'Nice — your body is ready.' : `${done}/${items.length} done · tap to open`)),
        svgIcon('chev', 'ico muted')))
  }
  return h('section', { class: 'card wu-card' },
    h('div', { class: 'row between' },
      h('div', null, h('div', { class: 'label accent' }, `Step 1 · Warm-up · ${WARMUP_MIN} min`), h('div', { class: 'muted small' }, 'Gets blood to your muscles and joints ready — fewer injuries, better lifts.')),
      h('button', { class: 'link', onclick: toggleOpen }, all ? 'Hide' : 'Skip')),
    h('ul', { class: 'wu-list' }, items.map((w, i) => h('li', null,
      h('div', { class: 'grow' + (w.id ? ' tap' : ''), onclick: w.id ? () => exerciseSheet(w.id) : null },
        h('div', null, w.t, w.id ? svgIcon('info', 'ico sm muted') : null), h('div', { class: 'muted small' }, w.d)),
      h('button', {
        class: 'check' + (A.warm[i] ? ' on' : ''),
        'aria-label': A.warm[i] ? 'Mark not done' : 'Mark done',
        onclick: () => update(S => {
          S.active.warm[i] = !S.active.warm[i]
          if (WARMUPS[S.active.wu].every((_, j) => S.active.warm[j])) S.active.warmOpen = false
        })
      }, svgIcon('check'))))))
}

function EntryCard (entry, idx, unit, warmupSets = false) {
  const ex = EX[entry.ex]
  const timed = isTimed(entry.ex)
  const bw = isBodyweight(entry.ex) || timed
  const sug = suggestion(entry)
  const allDone = entry.sets.length && entry.sets.every(s => s.done)
  const perHand = ['dumbbell', 'kettlebell'].includes(ex.eq)
  // Long timed work (treadmill, bike) is entered in minutes and stored in seconds.
  const mins = timed && entry.max >= 120
  const rShow = r => mins ? Math.round(r / 6) / 10 : r
  const rFmt = r => mins ? `${rShow(r)} min` : `${r}s`

  const prevText = sug.sets.length
    ? 'Last time: ' + sug.sets.map(s => timed ? rFmt(s.r) : (s.w ? `${fmtW(s.w, unit)}×${s.r}` : `${s.r}`)).join(', ')
    : timed ? 'First time — go at a comfortable pace.'
      : bw ? 'First time — move slowly and with control.'
        : `First time — start light: choose a weight you could lift 3–4 more times than ${entry.max}.${perHand ? ' Weight is per dumbbell.' : ''}`
  const tip = sug.hit && !timed && !bw && sug.w ? `You hit all reps last time — try ${fmtW(sug.w, unit)} ${unit} today.` : null
  const warmTip = warmupSets && !timed && !bw
    ? 'Before your first set: do 1 warm-up set of 10 reps with about half the weight. Don’t tick it — warm-up sets aren’t counted.'
    : null

  // Placeholders: what the app expects you to do for each set.
  // Falls back to the set above, so a weight typed into set 1 carries down the list.
  const ph = i => {
    const p = sug.sets[i] || sug.sets.at(-1)
    const above = entry.sets.slice(0, i).reverse().find(s => s.w != null || s.r != null)
    const w = above?.w ?? (sug.hit ? sug.w : (p?.w ?? sug.w))
    const r = timed ? (above?.r ?? sug.r ?? p?.r ?? entry.min) : (sug.hit ? entry.min : (p?.r ?? above?.r ?? entry.max))
    return { w, r }
  }

  return h('section', { class: 'card entry' + (allDone ? ' complete' : '') },
    h('div', { class: 'entry-head' },
      h('img', { class: 'thumb tap', loading: 'lazy', src: gifSrc(ex), alt: '', onclick: () => exerciseSheet(entry.ex) }),
      h('div', { class: 'grow tap', onclick: () => exerciseSheet(entry.ex) },
        h('div', { class: 'strong' }, ex.n),
        h('div', { class: 'muted small' }, `${entry.sets.length} × ${repText({ id: entry.ex, min: entry.min, max: entry.max })}${timed ? '' : ' reps'}${entry.rest ? ` · rest ${entry.rest}s` : ''}`)),
      h('button', { class: 'icon-btn', 'aria-label': 'Exercise options', onclick: () => entryMenu(idx) }, svgIcon('more'))),
    h('div', { class: 'prev small muted' }, prevText),
    tip ? h('div', { class: 'tip small' }, svgIcon('flame', 'ico sm'), tip) : null,
    warmTip ? h('div', { class: 'tip info small' }, svgIcon('info', 'ico sm'), warmTip) : null,
    h('div', { class: 'sets' },
      h('div', { class: 'set-row head' }, h('span', null, 'Set'), h('span', null, mins ? '' : bw ? `+${unit}` : perHand ? `${unit} each` : unit), h('span', null, mins ? 'min' : timed ? 'sec' : 'reps'), h('span', null, '')),
      entry.sets.map((s, si) => {
        const p = ph(si)
        const wIn = h('input', {
          class: 'num', inputmode: 'decimal', type: 'text', 'aria-label': `Set ${si + 1} weight`,
          placeholder: p.w ? fmtW(p.w, unit) : (bw ? 'BW' : '–'),
          value: s.w != null ? fmtW(s.w, unit) : '',
          oninput: ev => { const v = parseFloat(ev.target.value.replace(',', '.')); update(S => { S.active.entries[idx].sets[si].w = isNaN(v) ? null : +fromDisplay(v, unit).toFixed(3) }, { quiet: true }) }
        })
        const rIn = h('input', {
          class: 'num', inputmode: 'numeric', type: 'text', 'aria-label': `Set ${si + 1} ${timed ? 'seconds' : 'reps'}`,
          placeholder: p.r != null ? rShow(p.r) : '',
          value: s.r != null ? rShow(s.r) : '',
          oninput: ev => { const v = parseFloat(ev.target.value.replace(',', '.')); update(S => { S.active.entries[idx].sets[si].r = isNaN(v) ? null : Math.round(mins ? v * 60 : v) }, { quiet: true }) }
        })
        return h('div', { class: 'set-row' + (s.done ? ' done' : '') },
          h('span', { class: 'set-n' }, si + 1),
          mins ? h('span', { class: 'num na' }, '—') : wIn, rIn,
          h('button', { class: 'check', 'aria-label': s.done ? 'Mark set not done' : 'Mark set done', onclick: () => toggleSet(idx, si, ph(si), wIn, bw) }, svgIcon('check')))
      })),
    h('div', { class: 'entry-foot' },
      h('button', { class: 'link', onclick: () => update(S => { const es = S.active.entries[idx].sets; const l = es.at(-1); es.push({ w: l?.w ?? null, r: l?.r ?? null, done: false }) }) }, svgIcon('plus', 'ico sm'), 'Add set'),
      entry.sets.length > 1 ? h('button', { class: 'link', onclick: () => update(S => { S.active.entries[idx].sets.pop() }) }, svgIcon('minus', 'ico sm'), 'Remove set') : null))
}

function toggleSet (idx, si, p, wIn, bw) {
  const S = state()
  const s = S.active.entries[idx].sets[si]
  if (!s.done) {
    const w = s.w ?? p.w
    const r = s.r ?? p.r
    if (!bw && !w) { wIn.focus(); wIn.classList.add('shake'); setTimeout(() => wIn.classList.remove('shake'), 400); toast('Enter the weight first'); return }
    if (!r) { toast('Enter reps first'); return }
    unlockAudio()
    update(S => {
      const t = S.active.entries[idx].sets[si]
      t.w = w ?? 0; t.r = r; t.done = true
      const rest = S.active.entries[idx].rest
      S.restEnd = rest ? Date.now() + rest * 1000 : null
      S.restTotal = rest
    })
  } else {
    update(S => { S.active.entries[idx].sets[si].done = false })
  }
}

function RestBar () {
  const S = state()
  if (!S.restEnd || S.restEnd <= Date.now()) return null
  const adj = d => update(S => { S.restEnd = Math.max(Date.now() + 1000, S.restEnd + d * 1000); S.restTotal = Math.max(1, (S.restTotal || 0) + d) })
  return h('div', { class: 'restbar', id: 'restbar' },
    h('div', { class: 'rest-fill', id: 'rest-fill' }),
    h('div', { class: 'rest-inner' },
      h('button', { class: 'rest-btn', onclick: () => adj(-15) }, '−15'),
      h('div', { class: 'rest-mid' }, h('div', { class: 'small' }, 'Rest'), h('div', { class: 'rest-time', 'data-tick': 'rest' }, fmtDuration((S.restEnd - Date.now()) / 1000))),
      h('button', { class: 'rest-btn', onclick: () => adj(15) }, '+15'),
      h('button', { class: 'rest-btn skip', onclick: () => update(S => { S.restEnd = null }) }, 'Skip')))
}

function entryMenu (idx) {
  const entry = state().active.entries[idx]
  openSheet(close => h('div', { class: 'menu' },
    h('h3', null, EX[entry.ex].n),
    h('button', { class: 'menu-item', onclick: () => { close(); exerciseSheet(entry.ex) } }, svgIcon('info'), 'How to do it'),
    h('button', {
      class: 'menu-item',
      onclick: () => {
        close()
        exercisePicker({
          title: 'Swap for…', group: groupOf(EX[entry.ex].tg), target: EX[entry.ex].tg,
          onPick: id => update(S => { const e = S.active.entries[idx]; e.ex = id; e.sets.forEach(s => { s.w = null; s.done = false }) })
        })
      }
    }, svgIcon('swap'), 'Swap exercise (machine busy?)'),
    idx > 0 ? h('button', { class: 'menu-item', onclick: () => { close(); update(S => { const a = S.active.entries; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]] }) } }, svgIcon('back'), 'Move up') : null,
    h('div', { class: 'row gap' },
      h('span', { class: 'grow' }, 'Rest between sets'),
      ...[45, 60, 90, 120, 180].map(r => h('button', { class: 'chip' + (entry.rest === r ? ' on' : ''), onclick: () => { update(S => { S.active.entries[idx].rest = r }); close() } }, r + 's'))),
    h('button', { class: 'menu-item danger', onclick: () => { close(); update(S => { S.active.entries.splice(idx, 1) }) } }, svgIcon('trash'), 'Remove from workout')))
}

function workoutMenu () {
  openSheet(close => h('div', { class: 'menu' },
    h('h3', null, 'Workout'),
    h('button', { class: 'menu-item', onclick: () => { close(); finishWorkout() } }, svgIcon('check'), 'Finish & save'),
    h('button', {
      class: 'menu-item danger',
      onclick: () => {
        if (!confirm('Discard this workout? Nothing will be saved.')) return
        close(); keepAwake(false); update(S => { S.active = null; S.restEnd = null })
      }
    }, svgIcon('trash'), 'Discard workout')))
}

function finishWorkout () {
  const S = state()
  const A = S.active
  const entries = A.entries
    .map(e => ({ ex: e.ex, sets: e.sets.filter(s => s.done).map(s => ({ w: s.w || 0, r: s.r || 0 })) }))
    .filter(e => e.sets.length)
  if (!entries.length) {
    if (confirm('No sets are ticked yet. Discard this workout?')) { keepAwake(false); update(S => { S.active = null; S.restEnd = null }) }
    return
  }
  const unticked = A.entries.reduce((n, e) => n + e.sets.filter(s => !s.done).length, 0)
  if (unticked && !confirm(`${unticked} set${unticked > 1 ? 's are' : ' is'} not ticked and won't be saved. Finish anyway?`)) return

  const prs = []
  for (const e of entries) {
    const before = bestOf(e.ex)
    const now = Math.max(...e.sets.map(s => setScore(e.ex, s)))
    if (before > 0 && now > before + 0.01) prs.push(e.ex)
  }
  const w = { id: A.id, date: isoDate(new Date(A.startedAt)), startedAt: A.startedAt, endedAt: Date.now(), planId: A.planId, dayIdx: A.dayIdx, name: A.name, entries }
  update(S => {
    S.workouts.push(w)
    S.active = null; S.restEnd = null
  })
  keepAwake(false)
  ui.tab = 'today'; render(); window.scrollTo(0, 0)
  summarySheet(w, prs)
}

function summarySheet (w, prs) {
  const unit = state().settings.unit
  const sets = w.entries.reduce((n, e) => n + e.sets.length, 0)
  const vol = w.entries.reduce((n, e) => n + e.sets.reduce((m, s) => m + s.w * s.r * (isTimed(e.ex) ? 0 : 1), 0), 0)
  openSheet(close => h('div', { class: 'summary' },
    h('div', { class: 'confetti' }, '🎉'),
    h('h2', null, 'Workout complete!'),
    h('p', { class: 'muted' }, w.name),
    h('div', { class: 'stats3' },
      Stat(fmtMinutes((w.endedAt - w.startedAt) / 1000), 'Duration'),
      Stat(sets, 'Sets'),
      vol > 0 ? Stat(Math.round(toDisplay(vol, unit)).toLocaleString(), `Volume (${unit})`) : Stat(w.entries.length, 'Exercises')),
    prs.length ? h('div', { class: 'card flat pr' }, h('div', { class: 'label accent' }, svgIcon('trophy', 'ico sm'), ` ${prs.length} new personal record${prs.length > 1 ? 's' : ''}`), prs.map(id => h('div', null, EX[id].n))) : null,
    h('button', { class: 'btn primary block', onclick: close }, 'Done')))
}

const Stat = (v, l) => h('div', { class: 'stat' }, h('div', { class: 'big' }, v), h('div', { class: 'muted small' }, l))

/* ================================ timers, sound, wake lock ================================ */

let audioCtx = null
function unlockAudio () {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch {}
}
function beep () {
  if (!state().settings.sound || !audioCtx) return
  const t = audioCtx.currentTime
  ;[0, 0.22, 0.44].forEach((d, i) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.frequency.value = i === 2 ? 1320 : 880
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.4, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18)
    o.connect(g).connect(audioCtx.destination); o.start(t + d); o.stop(t + d + 0.2)
  })
  navigator.vibrate?.([200, 100, 200])
}

let wakeLock = null
async function keepAwake (on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null }) }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null }
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state().active) keepAwake(true) })

function tick () {
  const S = state()
  if (!S.active) return
  const el = document.querySelector('[data-tick="elapsed"]')
  if (el) el.textContent = fmtDuration((Date.now() - S.active.startedAt) / 1000)
  if (S.restEnd) {
    const left = (S.restEnd - Date.now()) / 1000
    if (left <= 0) {
      update(S => { S.restEnd = null })
      beep(); toast('Rest over — next set!')
      return
    }
    const r = document.querySelector('[data-tick="rest"]')
    if (r) r.textContent = fmtDuration(Math.ceil(left))
    const f = document.getElementById('rest-fill')
    if (f) f.style.width = `${Math.max(0, Math.min(100, (1 - left / (S.restTotal || 90)) * 100))}%`
  }
}
setInterval(tick, 500)

/* ================================ EXERCISE DETAIL ================================ */

function exerciseSheet (id) {
  const ex = EX[id]
  const unit = state().settings.unit
  const sessions = sessionsOf(id)
  const timed = isTimed(id)
  const best = bestOf(id, sessions)
  let bestSet = null
  for (const x of sessions) for (const s of x.sets) if (!bestSet || setScore(id, s) > setScore(id, bestSet)) bestSet = s
  const points = sessions.map(x => ({ x: x.startedAt, y: Math.max(...x.sets.map(s => setScore(id, s))) }))
  const yFmt = v => timed || !bestSet?.w ? Math.round(v) : fmtW(v, unit)

  openSheet(() => h('div', null,
    h('div', { class: 'gif-wrap' }, h('img', { src: gifSrc(ex), alt: `${ex.n} demonstration`, class: 'gif' })),
    h('h2', null, ex.n),
    h('div', { class: 'tags' },
      h('span', { class: 'pill accent' }, cap(ex.tg)),
      (ex.sm || []).slice(0, 4).map(m => h('span', { class: 'pill' }, cap(m))),
      h('span', { class: 'pill outline' }, cap(ex.eq))),
    h('div', { class: 'section-title' }, 'How to do it'),
    h('ol', { class: 'steps' }, ex.st.map(s => h('li', null, s))),
    h('div', { class: 'section-title' }, 'Your progress'),
    sessions.length
      ? h('div', null,
        h('div', { class: 'stats3' },
          Stat(sessions.length, 'Sessions'),
          Stat(bestSet ? (timed ? secs(bestSet.r) : bestSet.w ? `${fmtW(bestSet.w, unit)}×${bestSet.r}` : `${bestSet.r}`) : '–', 'Best set'),
          Stat(timed || !bestSet?.w ? '–' : `${fmtW(best, unit)}`, `Est. 1RM${timed || !bestSet?.w ? '' : ` (${unit})`}`)),
        lineChart(points, { fmtY: yFmt, label: `${ex.n} progress` }),
        h('div', { class: 'small muted center' }, timed ? 'Longest set each session (seconds)' : bestSet?.w ? 'Estimated one-rep max each session' : 'Most reps each session'),
        h('ul', { class: 'hist' }, sessions.slice(-6).reverse().map(x => h('li', null,
          h('span', { class: 'muted' }, fmtDate(parseISO(x.date))),
          h('span', null, x.sets.map(s => timed ? secs(s.r) : s.w ? `${fmtW(s.w, unit)}×${s.r}` : `${s.r}`).join(' · '))))))
      : h('p', { class: 'muted' }, 'No sets logged yet. Your weights and records will show here.')), { full: true })
}

/* ================================ EXERCISE PICKER + LIBRARY ================================ */

function filterExercises (q, group, target) {
  q = q.trim().toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  return EXERCISES.filter(e =>
    (group === 'All' || GROUPS[group]?.includes(e.tg)) &&
    (!target || e.tg === target) &&
    words.every(w => e.n.toLowerCase().includes(w) || e.eq.includes(w) || e.tg.includes(w)))
}

function ExerciseFilter ({ get, set, onChange }) {
  const list = h('div')
  const draw = () => {
    const { q, group, target } = get()
    const all = filterExercises(q, group, target)
    const shown = all.slice(0, 80)
    list.replaceChildren(
      h('div', { class: 'muted small count' }, `${all.length} exercise${all.length === 1 ? '' : 's'}${target ? ` for ${target}` : ''}${all.length > shown.length ? ' · showing first 80, search to narrow' : ''}`),
      h('ul', { class: 'ex-rows' }, shown.map(e => h('li', { class: 'tap', onclick: () => onChange(e.id) },
        h('img', { class: 'thumb', loading: 'lazy', src: gifSrc(e), alt: '' }),
        h('div', { class: 'grow' }, h('div', null, e.n), h('div', { class: 'muted small' }, `${cap(e.tg)} · ${e.eq}`)),
        svgIcon('chev', 'ico muted')))))
  }
  const chips = h('div', { class: 'chips scroll-x' })
  const drawChips = () => {
    const { group, target } = get()
    chips.replaceChildren(...[
      target ? h('button', { class: 'chip on', onclick: () => { set({ target: null }); drawChips(); draw() } }, `${cap(target)} ✕`) : null,
      ['All', ...Object.keys(GROUPS)].map(g => h('button', { class: 'chip' + (group === g && !target ? ' on' : ''), onclick: () => { set({ group: g, target: null }); drawChips(); draw() } }, g))].flat().filter(Boolean))
  }
  const search = h('label', { class: 'search' }, svgIcon('search', 'ico muted'),
    h('input', { type: 'search', placeholder: 'Search exercises', value: get().q, oninput: ev => { set({ q: ev.target.value }); draw() } }))
  drawChips(); draw()
  return h('div', null, search, chips, list)
}

function exercisePicker ({ title, onPick, group = 'All', target = null }) {
  const st = { q: '', group, target }
  openSheet(close => h('div', null,
    h('h2', null, title),
    ExerciseFilter({ get: () => st, set: v => Object.assign(st, v), onChange: id => { close(); onPick(id) } })), { full: true })
}

function LibraryScreen () {
  return [
    h('header', { class: 'top' }, h('div', null, h('div', { class: 'eyebrow' }, `${EXERCISES.length} with how-to guides`), h('h1', null, 'Exercises'))),
    ExerciseFilter({
      get: () => ({ q: ui.libQuery, group: ui.libGroup, target: null }),
      set: v => { if ('q' in v) ui.libQuery = v.q; if ('group' in v) ui.libGroup = v.group },
      onChange: id => exerciseSheet(id)
    })
  ]
}

/* ================================ PROGRESS ================================ */

function ProgressScreen () {
  const S = state()
  const unit = S.settings.unit
  const ws = S.workouts
  const month = isoDate(new Date()).slice(0, 7)

  // weeks in a row (ending this or last week) with at least one workout
  let streak = 0
  const weeks = new Set(ws.map(w => isoDate(startOfWeek(parseISO(w.date)))))
  const cur = startOfWeek()
  if (!weeks.has(isoDate(cur))) cur.setDate(cur.getDate() - 7)
  while (weeks.has(isoDate(cur))) { streak++; cur.setDate(cur.getDate() - 7) }

  // exercises you've done, most frequent first
  const freq = {}
  ws.forEach(w => w.entries.forEach(e => { if (!isTimed(e.ex)) freq[e.ex] = (freq[e.ex] || 0) + 1 }))
  const lifts = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || bestOf(b) - bestOf(a))
  if (!ui.liftId || !freq[ui.liftId]) ui.liftId = lifts[0] || null

  const bw = [...S.bodyweight].sort((a, b) => a.date.localeCompare(b.date))
  const bwLast = bw.at(-1); const bwFirst = bw[0]

  return [
    h('header', { class: 'top' }, h('div', null, h('div', { class: 'eyebrow' }, 'Your training'), h('h1', null, 'Progress'))),
    h('div', { class: 'stats3 card' },
      Stat(ws.length, 'Workouts'),
      Stat(ws.filter(w => w.date.startsWith(month)).length, 'This month'),
      Stat(streak, streak === 1 ? 'Week streak' : 'Weeks streak')),

    h('div', { class: 'section-title row between' }, h('span', null, 'Body weight'), h('button', { class: 'link', onclick: weighInSheet }, svgIcon('plus', 'ico sm'), 'Log weight')),
    h('section', { class: 'card' },
      bwLast
        ? [h('div', { class: 'row between' },
            h('div', null, h('div', { class: 'big' }, fmtW(bwLast.kg, unit), h('span', { class: 'muted' }, ` ${unit}`)), h('div', { class: 'muted small' }, fmtDate(parseISO(bwLast.date)))),
            bw.length > 1 ? h('div', { class: 'delta' + (bwLast.kg - bwFirst.kg > 0 ? ' up' : ' down') }, `${bwLast.kg - bwFirst.kg > 0 ? '+' : ''}${fmtW(bwLast.kg - bwFirst.kg, unit)} ${unit}`, h('div', { class: 'muted small' }, 'since start')) : null),
          bw.length > 1 ? lineChart(bw.map(b => ({ x: parseISO(b.date), y: toDisplay(b.kg, unit) })), { fmtY: v => v.toFixed(1), label: 'Body weight' }) : null]
        : h('p', { class: 'muted' }, 'Log your weight once a week (same time of day) to see your trend.')),

    h('div', { class: 'section-title' }, 'Strength'),
    h('section', { class: 'card' },
      lifts.length
        ? [h('select', { class: 'select', onchange: ev => { ui.liftId = ev.target.value; render() } }, lifts.map(id => h('option', { value: id, selected: id === ui.liftId }, EX[id].n))),
            LiftChart(ui.liftId, unit)]
        : h('p', { class: 'muted' }, 'Finish a workout and your strength charts appear here.')),

    h('div', { class: 'section-title' }, 'History'),
    ws.length
      ? h('ul', { class: 'card list' }, [...ws].reverse().slice(0, 50).map(w => h('li', { class: 'tap', onclick: () => workoutDetailSheet(w.id) },
          h('div', { class: 'grow' }, h('div', null, w.name), h('div', { class: 'muted small' }, `${fmtDate(parseISO(w.date))} · ${fmtMinutes((w.endedAt - w.startedAt) / 1000)} · ${w.entries.reduce((n, e) => n + e.sets.length, 0)} sets`)),
          svgIcon('chev', 'ico muted'))))
      : h('p', { class: 'muted card' }, 'No workouts yet.')
  ]
}

function LiftChart (id, unit) {
  const sessions = sessionsOf(id)
  const weighted = sessions.some(x => x.sets.some(s => s.w > 0))
  const pts = sessions.map(x => ({ x: x.startedAt, y: weighted ? toDisplay(Math.max(...x.sets.map(s => e1rm(s.w, s.r))), unit) : Math.max(...x.sets.map(s => s.r)) }))
  return h('div', null,
    lineChart(pts, { fmtY: v => Math.round(v), label: 'Strength progress' }),
    h('div', { class: 'small muted center' }, weighted ? `Estimated one-rep max (${unit})` : 'Most reps in a set'),
    h('button', { class: 'link center block', onclick: () => exerciseSheet(id) }, 'See exercise details'))
}

function weighInSheet () {
  const unit = state().settings.unit
  let val = ''; let date = todayISO()
  openSheet((close, refresh) => {
    const list = [...state().bodyweight].sort((a, b) => b.date.localeCompare(a.date))
    return h('div', null,
      h('h2', null, 'Log body weight'),
      h('div', { class: 'row gap' },
        h('input', { class: 'num big-input', inputmode: 'decimal', placeholder: list[0] ? fmtW(list[0].kg, unit) : unit, value: val, oninput: e => { val = e.target.value } }),
        h('span', { class: 'muted' }, unit),
        h('input', { type: 'date', class: 'date', value: date, max: todayISO(), onchange: e => { date = e.target.value } })),
      h('button', {
        class: 'btn primary block',
        onclick: () => {
          const v = parseFloat(String(val).replace(',', '.'))
          if (!(v > 0)) { toast('Enter your weight'); return }
          update(S => { S.bodyweight = S.bodyweight.filter(b => b.date !== date); S.bodyweight.push({ date, kg: +fromDisplay(v, unit).toFixed(2) }) })
          close(); toast('Weight saved')
        }
      }, 'Save'),
      list.length ? h('div', null, h('div', { class: 'section-title' }, 'Recent'),
        h('ul', { class: 'list' }, list.slice(0, 12).map(b => h('li', null,
          h('span', { class: 'grow' }, fmtDate(parseISO(b.date))), h('strong', null, `${fmtW(b.kg, unit)} ${unit}`),
          h('button', { class: 'icon-btn', 'aria-label': 'Delete', onclick: () => { update(S => { S.bodyweight = S.bodyweight.filter(x => x.date !== b.date) }); refresh() } }, svgIcon('trash', 'ico sm')))))) : null)
  })
}

function workoutDetailSheet (id) {
  const w = state().workouts.find(x => x.id === id)
  if (!w) return
  const unit = state().settings.unit
  openSheet(close => h('div', null,
    h('div', { class: 'label' }, fmtDate(parseISO(w.date), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
    h('h2', null, w.name),
    h('p', { class: 'muted' }, `${fmtMinutes((w.endedAt - w.startedAt) / 1000)} · ${w.entries.reduce((n, e) => n + e.sets.length, 0)} sets`),
    w.entries.map(e => h('div', { class: 'card flat' },
      h('div', { class: 'strong tap', onclick: () => exerciseSheet(e.ex) }, EX[e.ex]?.n || e.ex),
      h('div', { class: 'muted small' }, e.sets.map(s => isTimed(e.ex) ? secs(s.r) : s.w ? `${fmtW(s.w, unit)} ${unit} × ${s.r}` : `${s.r} reps`).join('  ·  ')))),
    h('button', {
      class: 'btn danger-ghost block',
      onclick: () => { if (confirm('Delete this workout from your history?')) { update(S => { S.workouts = S.workouts.filter(x => x.id !== id) }); close() } }
    }, 'Delete workout')), { full: true })
}

/* ================================ SETTINGS ================================ */

function settingsSheet () {
  openSheet((close, refresh) => {
    const S = state()
    const plan = planById(S.planId)
    return h('div', { class: 'menu' },
      h('h2', null, 'Settings'),
      h('div', { class: 'row between setting' }, h('span', null, 'Units'),
        h('div', { class: 'seg' }, ['kg', 'lb'].map(u => h('button', { class: S.settings.unit === u ? 'on' : '', onclick: () => { update(S => { S.settings.unit = u }); refresh() } }, u)))),
      h('div', { class: 'row between setting' }, h('span', null, 'Beep when rest is over'),
        h('div', { class: 'seg' }, [['On', true], ['Off', false]].map(([l, v]) => h('button', { class: S.settings.sound === v ? 'on' : '', onclick: () => { update(S => { S.settings.sound = v }); refresh() } }, l)))),
      h('div', { class: 'row between setting' }, h('span', null, 'Plan'), h('button', { class: 'link', onclick: () => { close(); ui.tab = 'plans'; render() } }, plan ? plan.short + ' — change' : 'Choose')),
          h('button', { class: 'menu-item', onclick: tipsSheet }, '💡 New to the gym? Tips'),
      h('div', { class: 'section-title' }, 'Your data'),
      h('p', { class: 'muted small' }, 'Everything is stored only on this phone. Export a backup now and then (e.g. to Files or iCloud Drive).'),
      h('button', { class: 'menu-item', onclick: exportData }, 'Export backup'),
      h('label', { class: 'menu-item' }, 'Import backup', h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: e => importData(e, close) })),
      h('button', { class: 'menu-item danger', onclick: () => { if (confirm('Erase ALL workouts, weights and settings on this phone?') && confirm('Really erase everything? This cannot be undone.')) { resetAll(); close() } } }, 'Erase all data'),
      h('p', { class: 'muted small credits' }, 'Exercise names & instructions: ExerciseDB via hasaneyldrm/exercises-dataset (MIT). Animations are loaded from that public dataset for personal use.'))
  })
}

async function exportData () {
  const json = JSON.stringify({ ...state(), exportedAt: new Date().toISOString() }, null, 1)
  const name = `liftlog-backup-${todayISO()}.json`
  const file = new File([json], name, { type: 'application/json' })
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'LiftLog backup' }); return }
  } catch (e) { if (e.name === 'AbortError') return }
  const a = h('a', { href: URL.createObjectURL(file), download: name })
  document.body.append(a); a.click(); a.remove()
}

function importData (ev, close) {
  const f = ev.target.files?.[0]
  if (!f) return
  f.text().then(txt => {
    const data = JSON.parse(txt)
    if (!confirm(`Replace everything on this phone with the backup (${data.workouts?.length ?? 0} workouts)?`)) return
    replaceAll(data); close(); toast('Backup restored')
  }).catch(() => toast('That file is not a LiftLog backup'))
}

/* ================================ boot ================================ */

render()
if (state().active) keepAwake(true)
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {})
