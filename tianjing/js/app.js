import { Starfield } from './starfield.js'
import { renderChart } from './chart.js'
import { analyzePatterns, buildPatternSummary } from './patterns.js'
import { buildAllPalaceReadings, buildSummary } from './palaces.js'
import { collectChartStars } from './stars.js'
import { buildHoroscopeData, renderHoroscopeSection, bindDecadalTimeline } from './horoscope.js'
import { buildMutagenData, renderMutagenSection } from './mutagen.js'
import { generateAIReading, renderAISections } from './ai-reading.js'
import { checkProxy, renderApiKeySettings, bindApiKeySettings } from './api-config.js'
import { getRecords, addRecord, renderHistorySection, bindHistory } from './history.js'

const THEME_KEY = 'ziwei_theme'

const els = {
  body: document.body,
  form: document.getElementById('birthForm'),
  formCard: document.getElementById('formCard'),
  resultSection: document.getElementById('resultSection'),
  birthDate: document.getElementById('birthDate'),
  birthTime: document.getElementById('birthTime'),
  retryBtn: document.getElementById('retryBtn'),
  themeToggle: document.getElementById('themeToggle'),
  metaSolar: document.getElementById('metaSolar'),
  metaLunar: document.getElementById('metaLunar'),
  metaPillars: document.getElementById('metaPillars'),
  metaFive: document.getElementById('metaFive'),
  metaZodiac: document.getElementById('metaZodiac'),
  metaSign: document.getElementById('metaSign'),
  tabBar: document.getElementById('tabBar'),
  patternList: document.getElementById('patternList'),
  patternSummary: document.getElementById('patternSummary'),
  palaceList: document.getElementById('palaceList'),
  starList: document.getElementById('starList'),
  horoscopePanel: document.getElementById('horoscopePanel'),
  mutagenPanel: document.getElementById('mutagenPanel'),
  aiPanel: document.getElementById('aiPanel'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  historyMount: document.getElementById('historyMount')
}

let starfield = null
let lastBirthDate = ''

function applyTheme(theme) {
  els.body.classList.remove('theme-dark', 'theme-light')
  els.body.classList.add(`theme-${theme}`)
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#080810' : '#f4f2ee'
  els.themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀' : '☽'
  starfield?.setTheme(theme)
  localStorage.setItem(THEME_KEY, theme)
}

function loadTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark')
}

function getGender() {
  return els.form.querySelector('input[name="gender"]:checked')?.value || '男'
}

function formatDateForIztro(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}-${Number(m)}-${Number(d)}`
}

function computeChart(dateStr, timeIndex, gender) {
  if (!window.iztro?.astro?.bySolar) {
    throw new Error('排盘引擎加载失败，请检查网络后刷新')
  }
  return window.iztro.astro.bySolar(formatDateForIztro(dateStr), Number(timeIndex), gender, true, 'zh-CN')
}

function fillMeta(astrolabe) {
  els.metaSolar.textContent = astrolabe.solarDate || '—'
  els.metaLunar.textContent = astrolabe.lunarDate || '—'
  els.metaPillars.textContent = astrolabe.chineseDate || astrolabe.rawDates?.chineseDate || '—'
  els.metaFive.textContent = astrolabe.fiveElementsClass || '—'
  els.metaZodiac.textContent = astrolabe.zodiac || '—'
  els.metaSign.textContent = astrolabe.sign || '—'
}

function levelClass(level) {
  if (level === '大吉' || level === '吉') return 'badge-ji'
  if (level === '煞' || level === '变动') return 'badge-sha'
  return 'badge-ping'
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatReadingText(text) {
  return escapeHtml(text).replace(/\n/g, '<br/>')
}

function renderReadingItem(item, extraClass = '') {
  return `
    <article class="reading-item glass-inner ${extraClass} ${item.isMing ? 'reading-ming' : ''}">
      <h3 class="reading-title">${escapeHtml(item.title)}</h3>
      <p class="reading-sub">${escapeHtml(item.subtitle || '')}</p>
      <p class="reading-text reading-plain">${formatReadingText(item.text)}</p>
    </article>
  `
}

function fillPatterns(astrolabe) {
  const patterns = analyzePatterns(astrolabe)
  els.patternSummary.textContent = buildPatternSummary(patterns)
  els.patternList.innerHTML = patterns
    .map(
      (p) => `
      <article class="pattern-item glass-inner">
        <div class="pattern-head">
          <h3 class="pattern-name">${escapeHtml(p.name)}</h3>
          <span class="pattern-badge ${levelClass(p.level)}">${p.level}</span>
        </div>
        <p class="reading-text reading-plain">${formatReadingText(p.text)}</p>
      </article>
    `
    )
    .join('')
}

function fillPalaces(astrolabe) {
  const summary = buildSummary(astrolabe)
  const readings = buildAllPalaceReadings(astrolabe)
  els.palaceList.innerHTML = [
    summary ? renderReadingItem(summary, 'reading-summary') : '',
    ...readings.map((r) => renderReadingItem(r))
  ].join('')
}

function fillStars(astrolabe) {
  const stars = collectChartStars(astrolabe)
  if (!stars.length) {
    els.starList.innerHTML = '<p class="empty-hint">命盘中未识别到已收录星曜。</p>'
    return
  }

  els.starList.innerHTML = stars
    .map(
      (s) => `
      <article class="star-item glass-inner">
        <div class="star-head">
          <h3 class="star-name">${escapeHtml(s.name)}</h3>
          <span class="star-meta">${escapeHtml(s.type || '星曜')} · 在${escapeHtml(s.palace)}</span>
        </div>
        ${s.element ? `<p class="star-attr">${escapeHtml(s.nature || '')} · 五行${escapeHtml(s.element)}</p>` : ''}
        <p class="reading-text reading-plain">${escapeHtml(s.intro)}</p>
      </article>
    `
    )
    .join('')
}

function fillHoroscope(astrolabe, birthDateStr) {
  const data = buildHoroscopeData(astrolabe, birthDateStr)
  els.horoscopePanel.innerHTML = renderHoroscopeSection(data)
  bindDecadalTimeline(astrolabe, data, els.horoscopePanel)
}

function fillMutagen(astrolabe, horoscopeData) {
  const data = buildMutagenData(astrolabe, horoscopeData.horoscope)
  const { html, summary } = renderMutagenSection(data)
  els.mutagenPanel.innerHTML = `
    <p class="pattern-summary">${escapeHtml(summary)}</p>
    ${html}
  `
}

async function loadAIReading(astrolabe, birthDateStr) {
  const contentEl = els.aiPanel.querySelector('#aiReadingContent')
  if (!contentEl) return
  contentEl.innerHTML = '<p class="loading-hint">正在生成解盘…</p>'
  try {
    const result = await generateAIReading(astrolabe, birthDateStr)
    contentEl.innerHTML = renderAISections(result.sections, result)
  } catch (e) {
    contentEl.innerHTML = `<p class="empty-hint">解盘生成失败：${escapeHtml(e.message)}</p>`
  }
}

async function fillAI(astrolabe, birthDateStr) {
  await checkProxy()
  els.aiPanel.innerHTML = `${renderApiKeySettings()}<div id="aiReadingContent"><p class="loading-hint">正在生成解盘…</p></div>`
  bindApiKeySettings(els.aiPanel, () => loadAIReading(astrolabe, birthDateStr))
  loadAIReading(astrolabe, birthDateStr)
}

function switchTab(tabId) {
  els.tabBar.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId)
  })
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tabId}`)
  })
}

function initTabs() {
  els.tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn')
    if (!btn) return
    switchTab(btn.dataset.tab)
  })
}

function setFormValues(birthDate, timeIndex, gender) {
  els.birthDate.value = birthDate
  els.birthTime.value = String(timeIndex)
  const radio = els.form.querySelector(`input[name="gender"][value="${gender}"]`)
  if (radio) radio.checked = true
}

function renderHistory() {
  if (!els.historyMount) return
  els.historyMount.innerHTML = renderHistorySection(getRecords())
}

function loadFromRecord(record) {
  setFormValues(record.birthDate, record.timeIndex, record.gender)
  try {
    const astrolabe = computeChart(record.birthDate, record.timeIndex, record.gender)
    showResult(astrolabe, record.birthDate, { skipSave: true })
  } catch (err) {
    alert(err.message || '加载记录失败')
  }
}

function initHistory() {
  renderHistory()
  bindHistory(els.historyMount, {
    onLoad: loadFromRecord,
    onChange: renderHistory
  })
}

async function showResult(astrolabe, birthDateStr, options = {}) {
  lastBirthDate = birthDateStr
  if (!options.skipSave) {
    addRecord({
      birthDate: birthDateStr,
      timeIndex: els.birthTime.value,
      gender: getGender(),
      astrolabe
    })
    renderHistory()
  }
  fillMeta(astrolabe)
  renderChart(astrolabe)
  fillPatterns(astrolabe)
  fillPalaces(astrolabe)
  fillStars(astrolabe)

  const horoscopeData = buildHoroscopeData(astrolabe, birthDateStr)
  fillHoroscope(astrolabe, birthDateStr)
  fillMutagen(astrolabe, horoscopeData)
  fillAI(astrolabe, birthDateStr)

  switchTab('ai')

  els.formCard.classList.add('hidden')
  els.resultSection.classList.remove('hidden')
  els.resultSection.classList.remove('result-visible')
  requestAnimationFrame(() => {
    requestAnimationFrame(() => els.resultSection.classList.add('result-visible'))
  })

  els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetForm() {
  els.resultSection.classList.add('hidden')
  els.formCard.classList.remove('hidden')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function initDefaults() {
  const today = new Date()
  const y = today.getFullYear() - 25
  els.birthDate.value = `${y}-06-15`
}

function init() {
  starfield = new Starfield(document.getElementById('starfield'), 'dark')
  loadTheme()
  initDefaults()
  initTabs()
  initHistory()
  checkProxy()

  els.form.addEventListener('submit', (e) => {
    e.preventDefault()
    try {
      const birthDateStr = els.birthDate.value
      const astrolabe = computeChart(birthDateStr, els.birthTime.value, getGender())
      showResult(astrolabe, birthDateStr)
    } catch (err) {
      alert(err.message || '排盘失败，请检查输入')
    }
  })

  els.retryBtn.addEventListener('click', resetForm)
  els.themeToggle.addEventListener('click', () => {
    const next = els.body.classList.contains('theme-dark') ? 'light' : 'dark'
    applyTheme(next)
  })
}

init()
