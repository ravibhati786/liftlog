// Small DOM, formatting and maths helpers shared by every screen.

// h('div', { class: 'x', onclick }, child, [children], null) → Element
export function h (tag, props, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else if (k === 'html') el.innerHTML = v
    else if (k === 'value') el.value = v
    else el.setAttribute(k, v === true ? '' : v)
  }
  append(el, children)
  return el
}

function append (el, kids) {
  for (const c of kids) {
    if (c == null || c === false) continue
    if (Array.isArray(c)) append(el, c)
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
}

export const svgIcon = (name, cls = 'ico') => h('span', { class: cls, html: ICONS[name] || '' })

const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
export const ICONS = {
  today: I('<path d="M6.5 6.5 17.5 17.5M3 8l2-2 2 2-2 2zM17 18l2-2 2 2-2 2zM4.5 3.5l3 3M16.5 16.5l3 3"/>'),
  plans: I('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
  progress: I('<path d="M3 20h18M6 16l4-5 4 3 5-7"/>'),
  library: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  chev: I('<path d="M9 6l6 6-6 6"/>'),
  back: I('<path d="M15 6l-6 6 6 6"/>'),
  swap: I('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  trophy: I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>'),
  timer: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'),
  more: I('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  flame: I('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/>')
}

// ---- dates ----
export const todayISO = () => isoDate(new Date())
export const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString(undefined, opts)
export function startOfWeek (d = new Date()) { // Monday
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
export function fmtDuration (sec) {
  sec = Math.max(0, Math.round(sec))
  const hh = Math.floor(sec / 3600); const mm = Math.floor((sec % 3600) / 60); const ss = sec % 60
  return hh ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${mm}:${String(ss).padStart(2, '0')}`
}
export const fmtMinutes = sec => sec >= 3600 ? `${Math.floor(sec / 3600)}h ${Math.round((sec % 3600) / 60)}m` : `${Math.round(sec / 60)} min`

// ---- units (always stored as kg) ----
const LB = 2.2046226
export const toDisplay = (kg, unit) => unit === 'lb' ? kg * LB : kg
export const fromDisplay = (v, unit) => unit === 'lb' ? v / LB : v
export function fmtW (kg, unit) {
  const v = toDisplay(kg, unit)
  return String(Math.round(v * 10) / 10).replace(/\.0$/, '')
}

// Epley estimated one-rep max.
export const e1rm = (kg, reps) => reps > 0 && kg > 0 ? kg * (1 + Math.min(reps, 20) / 30) : 0

// ---- SVG line chart ----
// points: [{ x: Date|number, y: number }]
export function lineChart (points, { height = 150, fmtY = v => Math.round(v), label = '' } = {}) {
  const W = 340; const H = height; const P = { l: 34, r: 10, t: 12, b: 22 }
  if (points.length === 0) return h('div', { class: 'empty small' }, 'No data yet')
  const xs = points.map(p => +p.x); const ys = points.map(p => p.y)
  let x0 = Math.min(...xs); let x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5; x1 += 864e5 }
  let y0 = Math.min(...ys); let y1 = Math.max(...ys); const pad = (y1 - y0) * 0.15 || Math.max(1, y1 * 0.05)
  y0 -= pad; y1 += pad
  const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r)
  const Y = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(+p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('')
  const area = `${d}L${X(+points.at(-1).x).toFixed(1)},${H - P.b}L${X(+points[0].x).toFixed(1)},${H - P.b}Z`
  const ticks = [y0 + (y1 - y0) * 0.15, (y0 + y1) / 2, y1 - (y1 - y0) * 0.15]
  const last = points.at(-1)
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${label}">
    ${ticks.map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${P.l - 6}" y="${Y(t) + 4}" class="axis" text-anchor="end">${fmtY(t)}</text>`).join('')}
    <text x="${P.l}" y="${H - 5}" class="axis">${fmtDate(x0, { day: 'numeric', month: 'short' })}</text>
    <text x="${W - P.r}" y="${H - 5}" class="axis" text-anchor="end">${fmtDate(x1, { day: 'numeric', month: 'short' })}</text>
    <path d="${area}" class="area"/><path d="${d}" class="line"/>
    ${points.length <= 40 ? points.map(p => `<circle cx="${X(+p.x)}" cy="${Y(p.y)}" r="2.6" class="dot"/>`).join('') : ''}
    <circle cx="${X(+last.x)}" cy="${Y(last.y)}" r="4.5" class="dot last"/>
  </svg>`
  return h('div', { class: 'chart-wrap', html: svg })
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
