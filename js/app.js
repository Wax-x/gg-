import { pickRandomFortune, getTodayKey } from './fortunes.js'
import { Starfield } from './starfield.js'

const STORAGE_KEY = 'gg_daily_fortune'
const THEME_KEY = 'gg_theme'

const els = {
  body: document.body,
  hero: document.getElementById('hero'),
  subtitle: document.getElementById('subtitle'),
  actionWrap: document.getElementById('actionWrap'),
  startBtn: document.getElementById('startBtn'),
  resultCard: document.getElementById('resultCard'),
  fortuneText: document.getElementById('fortuneText'),
  starsEl: document.getElementById('starsEl'),
  luckyColor: document.getElementById('luckyColor'),
  luckyDirection: document.getElementById('luckyDirection'),
  luckyYi: document.getElementById('luckyYi'),
  luckyJi: document.getElementById('luckyJi'),
  retryBtn: document.getElementById('retryBtn'),
  footer: document.getElementById('footer'),
  updateTime: document.getElementById('updateTime'),
  themeToggle: document.getElementById('themeToggle')
}

let starfield = null

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function renderStars(count) {
  els.starsEl.innerHTML = ''
  for (let i = 0; i < 5; i += 1) {
    const star = document.createElement('span')
    star.className = `star ${i < count ? 'star-on' : 'star-off'}`
    star.textContent = '★'
    els.starsEl.appendChild(star)
  }
}

function applyTheme(theme) {
  els.body.classList.remove('theme-dark', 'theme-light')
  els.body.classList.add(`theme-${theme}`)
  const meta = document.querySelector('meta[name="theme-color"]')
  meta.content = theme === 'dark' ? '#0a0a0a' : '#f5f5f3'
  els.themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀' : '☽'
  starfield?.setTheme(theme)
  localStorage.setItem(THEME_KEY, theme)
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark'
  applyTheme(saved)
}

function showResult(result, animate = true) {
  els.hero.classList.add('hero-compact')
  els.subtitle.classList.add('hidden')
  els.actionWrap.classList.add('hidden')
  els.resultCard.classList.remove('hidden')
  els.footer.classList.remove('hidden')

  els.fortuneText.textContent = result.text
  renderStars(result.stars)
  els.luckyColor.textContent = result.color
  els.luckyDirection.textContent = result.direction
  els.luckyYi.textContent = result.yi
  els.luckyJi.textContent = result.ji
  els.updateTime.textContent = `占卜时间 · ${formatTime(result.drawnAt)}`

  if (animate) {
    els.resultCard.classList.remove('result-visible')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => els.resultCard.classList.add('result-visible'))
    })
  } else {
    els.resultCard.classList.add('result-visible')
  }
}

function saveFortune(result) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: getTodayKey(),
    result,
    drawnAt: result.drawnAt
  }))
}

function loadStoredFortune() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const stored = JSON.parse(raw)
    if (stored.date === getTodayKey() && stored.result) {
      showResult(stored.result, false)
    }
  } catch {
    /* ignore */
  }
}

function drawFortune(fromRefresh = false) {
  if (els.resultCard.classList.contains('result-visible')) {
    els.resultCard.classList.remove('result-visible')
  }

  const delay = els.resultCard.classList.contains('hidden') ? 0 : 280

  setTimeout(() => {
    const result = pickRandomFortune()
    saveFortune(result)
    showResult(result, true)
    if (fromRefresh) showToast('已重新占卜')
  }, delay)
}

function showToast(msg) {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = msg
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('show'))
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 1400)
}

function initPullRefresh() {
  let startY = 0
  let pulling = false

  window.addEventListener('touchstart', (e) => {
    if (window.scrollY > 0) return
    startY = e.touches[0].clientY
    pulling = true
  }, { passive: true })

  window.addEventListener('touchmove', (e) => {
    if (!pulling) return
    const delta = e.touches[0].clientY - startY
    if (delta > 80 && window.scrollY === 0) {
      pulling = false
      drawFortune(true)
    }
  }, { passive: true })

  window.addEventListener('touchend', () => {
    pulling = false
  })
}

function init() {
  starfield = new Starfield(document.getElementById('starfield'), 'dark')
  loadTheme()
  loadStoredFortune()

  els.startBtn.addEventListener('click', () => drawFortune(false))
  els.retryBtn.addEventListener('click', () => drawFortune(false))
  els.themeToggle.addEventListener('click', () => {
    const next = els.body.classList.contains('theme-dark') ? 'light' : 'dark'
    applyTheme(next)
  })

  initPullRefresh()
}

init()
