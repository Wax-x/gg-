const STORAGE_KEY = 'ziwei_chart_history'
const MAX_RECORDS = 30

export const TIME_LABELS = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRaw(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function recordKey(r) {
  return `${r.birthDate}|${r.timeIndex}|${r.gender}`
}

export function getRecords() {
  return loadRaw().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function addRecord({ birthDate, timeIndex, gender, astrolabe }) {
  const list = loadRaw()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    birthDate,
    timeIndex: Number(timeIndex),
    gender,
    solar: astrolabe.solarDate || '',
    lunar: astrolabe.lunarDate || '',
    pillars: astrolabe.chineseDate || astrolabe.rawDates?.chineseDate || '',
    fiveElements: astrolabe.fiveElementsClass || '',
    zodiac: astrolabe.zodiac || '',
    createdAt: new Date().toISOString()
  }

  const key = recordKey(entry)
  const filtered = list.filter((r) => recordKey(r) !== key)
  filtered.unshift(entry)
  saveRaw(filtered.slice(0, MAX_RECORDS))
  return entry
}

export function removeRecord(id) {
  saveRaw(loadRaw().filter((r) => r.id !== id))
}

export function clearRecords() {
  localStorage.removeItem(STORAGE_KEY)
}

function formatWhen(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderHistorySection(records) {
  if (!records.length) {
    return `
      <section class="history-card glass" id="historyCard">
        <div class="history-head">
          <h2 class="history-title">排盘记录</h2>
        </div>
        <p class="empty-hint history-empty">暂无记录，完成排盘后会自动保存。</p>
      </section>
    `
  }

  const items = records
    .map(
      (r) => `
      <li class="history-item glass-inner" data-id="${escapeHtml(r.id)}">
        <button type="button" class="history-load" data-id="${escapeHtml(r.id)}">
          <span class="history-main">${escapeHtml(r.solar || r.birthDate)} · ${escapeHtml(TIME_LABELS[r.timeIndex] || '')} · ${escapeHtml(r.gender)}</span>
          <span class="history-sub">${escapeHtml(r.pillars)} · ${escapeHtml(r.fiveElements)} · ${escapeHtml(r.zodiac)}</span>
          <span class="history-time">${escapeHtml(formatWhen(r.createdAt))}</span>
        </button>
        <button type="button" class="history-del" data-id="${escapeHtml(r.id)}" aria-label="删除记录">×</button>
      </li>
    `
    )
    .join('')

  return `
    <section class="history-card glass" id="historyCard">
      <div class="history-head">
        <h2 class="history-title">排盘记录</h2>
        <button type="button" class="history-clear" id="historyClearBtn">清空</button>
      </div>
      <ul class="history-list">${items}</ul>
    </section>
  `
}

export function bindHistory(rootEl, { onLoad, onChange }) {
  if (!rootEl) return

  rootEl.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.history-del')
    if (delBtn) {
      e.stopPropagation()
      removeRecord(delBtn.dataset.id)
      onChange?.()
      return
    }

    const loadBtn = e.target.closest('.history-load')
    if (loadBtn) {
      const record = getRecords().find((r) => r.id === loadBtn.dataset.id)
      if (record) onLoad?.(record)
      return
    }

    if (e.target.closest('#historyClearBtn')) {
      if (getRecords().length && confirm('确定清空全部排盘记录？')) {
        clearRecords()
        onChange?.()
      }
    }
  })
}
