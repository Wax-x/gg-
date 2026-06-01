import { OPENAI_API_KEY as CONFIG_KEY, OPENAI_MODEL } from './config.js'

const STORAGE_KEY = 'ziwei_openai_api_key'

let proxyReady = null
let proxyHasKey = false

/** 检测本地 server.py 代理是否可用 */
export async function checkProxy() {
  if (proxyReady !== null) return proxyReady
  try {
    const res = await fetch('/api/health', { cache: 'no-store' })
    if (!res.ok) throw new Error('no proxy')
    const data = await res.json()
    proxyReady = Boolean(data.proxy)
    proxyHasKey = Boolean(data.hasKey)
    return proxyReady
  } catch {
    proxyReady = false
    proxyHasKey = false
    return false
  }
}

export function isProxyMode() {
  return proxyReady === true
}

export function isPublicHost() {
  const h = location.hostname
  return h !== 'localhost' && h !== '127.0.0.1' && !h.endsWith('.local')
}

export function canUseGptSettings() {
  return isProxyMode() || !isPublicHost()
}

export function proxyHasApiKey() {
  return proxyHasKey
}

/** 获取 API Key：代理模式不需要；否则 localStorage → config.js */
export function getApiKey() {
  if (proxyReady && proxyHasKey) return '__proxy__'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved.trim()) return saved.trim()
  } catch {
    /* ignore */
  }
  if (CONFIG_KEY && CONFIG_KEY.trim()) return CONFIG_KEY.trim()
  return ''
}

export function hasApiKey() {
  if (proxyReady && proxyHasKey) return true
  const key = getApiKey()
  return Boolean(key && key !== '__proxy__')
}

export function saveApiKey(key) {
  const trimmed = (key || '').trim()
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getModel() {
  return OPENAI_MODEL
}

/** 通过本地代理调用 GPT */
export async function chatViaProxy(body) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`)
  }
  return data
}

/** 统一 GPT 调用：优先本地代理，否则直连 OpenAI */
export async function callOpenAI(body) {
  if (isProxyMode() && proxyHasKey) {
    const data = await chatViaProxy(body)
    return data.content || ''
  }

  const apiKey = getApiKey()
  if (!apiKey || apiKey === '__proxy__') {
    throw new Error('未配置 API Key')
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `AI 请求失败 (${res.status})`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/** 保存 Key 到本地 server（.env.local） */
export async function saveApiKeyToServer(key) {
  const res = await fetch('/api/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: key })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || '保存失败')
  }
  proxyReady = true
  proxyHasKey = true
  return data
}

export function renderApiKeySettings() {
  if (!canUseGptSettings()) {
    return '<p class="panel-hint">公网版使用内置智能解读；GPT 深度解盘请本地运行 start.sh。</p>'
  }

  const enabled = hasApiKey()
  const proxy = isProxyMode()

  return `
    <div class="api-settings glass-inner" id="apiSettings">
      <div class="api-settings-head">
        <span class="api-settings-title">GPT 设置</span>
        <span class="api-status ${enabled ? 'api-on' : 'api-off'}" id="apiStatus">${enabled ? '已启用' : '未启用'}</span>
      </div>
      <p class="panel-hint" id="apiHint">${proxy ? '本地服务已连接。粘贴 API Key 后保存，即可启用 GPT 解盘（Key 仅保存在本机）。' : '填入 OpenAI API Key 即可启用 GPT 解盘。Key 仅保存在本机浏览器。'}</p>
      <label class="api-key-field">
        <span class="field-label">API Key</span>
        <input type="password" id="apiKeyInput" class="api-key-input" placeholder="sk-..." autocomplete="off" />
      </label>
      <div class="api-key-actions">
        <button type="button" class="api-btn api-btn-save" id="apiKeySaveBtn">保存并启用</button>
        <button type="button" class="api-btn api-btn-clear" id="apiKeyClearBtn">清除</button>
        <a class="api-link" href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">获取 API Key →</a>
      </div>
      <p class="api-msg hidden" id="apiKeyMsg"></p>
    </div>
  `
}

export function bindApiKeySettings(rootEl, onSaved) {
  const input = rootEl.querySelector('#apiKeyInput')
  const saveBtn = rootEl.querySelector('#apiKeySaveBtn')
  const clearBtn = rootEl.querySelector('#apiKeyClearBtn')
  const msg = rootEl.querySelector('#apiKeyMsg')
  const status = rootEl.querySelector('#apiStatus')

  if (!input) return

  if (hasApiKey()) {
    input.placeholder = '已配置（输入新 Key 可覆盖）'
  }

  function showMsg(text, ok = true) {
    if (!msg) return
    msg.textContent = text
    msg.classList.remove('hidden', 'api-msg-err')
    if (!ok) msg.classList.add('api-msg-err')
    setTimeout(() => msg.classList.add('hidden'), 4000)
  }

  function refreshStatus() {
    if (status) {
      const on = hasApiKey()
      status.textContent = on ? '已启用' : '未启用'
      status.classList.toggle('api-on', on)
      status.classList.toggle('api-off', !on)
    }
    if (hasApiKey()) {
      input.placeholder = '已配置（输入新 Key 可覆盖）'
    }
  }

  saveBtn?.addEventListener('click', async () => {
    const key = input.value.trim()
    if (!key.startsWith('sk-')) {
      showMsg('请输入有效的 OpenAI API Key（以 sk- 开头）', false)
      return
    }

    saveBtn.disabled = true
    try {
      if (isProxyMode()) {
        await saveApiKeyToServer(key)
      } else {
        saveApiKey(key)
      }
      input.value = ''
      refreshStatus()
      showMsg('GPT 已启用，可开始 AI 解盘')
      onSaved?.()
    } catch (e) {
      showMsg(e.message || '保存失败', false)
    } finally {
      saveBtn.disabled = false
    }
  })

  clearBtn?.addEventListener('click', () => {
    if (isProxyMode()) {
      showMsg('代理模式下请在项目目录删除 .env.local 后重启服务', false)
      return
    }
    clearApiKey()
    input.value = ''
    input.placeholder = 'sk-...'
    refreshStatus()
    showMsg('已清除 API Key，恢复本地解答模式')
    onSaved?.()
  })
}