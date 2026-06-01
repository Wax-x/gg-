import { buildFullChartContext, getMingStar } from './chart-context.js'
import { STAR_PLAIN } from './palace-simple.js'
import { getApiKey, callOpenAI, canUseGptSettings } from './api-config.js'
import { OPENAI_MODEL } from './config.js'

function generateLocalAIReading(ctx, star) {
  const sections = []

  sections.push({
    title: '一句话看懂你',
    text: star
      ? `你是「${star}坐命」的类型：${STAR_PLAIN[star] || ''} 命盘基调是${ctx.fiveElements}，整体属于${ctx.patterns || '平稳发展'}路线。`
      : `你属于借星成格的类型，外在表现受环境和流年影响较大。${ctx.fiveElements}为底色。`
  })

  sections.push({
    title: '性格与做事风格',
    text: `${ctx.ming}。${star ? STAR_PLAIN[star] : '宜随环境灵活调整。'} 职场上选能发挥特质的岗位，减少内耗。`
  })

  sections.push({
    title: '工作 & 赚钱',
    text: `${ctx.guanlu}；${ctx.caibo}。事业看位置，财帛看来源——技能和行业周期同样重要。`
  })

  sections.push({
    title: '感情 & 人际',
    text: `${ctx.fuqi}。有想法直接说，少猜；重大感情决定看流年是否稳定。`
  })

  sections.push({
    title: '当前运势',
    text: `【大限】${ctx.decadal}\n\n【流年】${ctx.yearly}`
  })

  sections.push({
    title: '三条实用建议',
    text: `1. 把${star || '命宫'}长处对准主线，别分散赛道。\n2. 流年有忌宜稳，有禄宜抓可见机会。\n3. 睡眠和运动是底层，别透支。`
  })

  return sections
}

async function generateOpenAIReading(ctx) {
  const prompt = `你是通俗紫微斗数顾问。根据命盘写解读，分6段：一句话总结、性格、工作赚钱、感情、当前运势、三条建议。大白话，每段2-4句。

${ctx.systemText}`

  const content = await callOpenAI({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: '你是专业但通俗的紫微斗数顾问。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1200
  })

  return parseAISections(content)
}

function parseAISections(content) {
  const lines = content.split('\n').filter(Boolean)
  const sections = []
  let current = null

  for (const line of lines) {
    const head = line.match(/^#{1,3}\s*(.+)|^\d+[.、]\s*(.+)|^【(.+)】/)
    if (head) {
      if (current) sections.push(current)
      current = { title: head[1] || head[2] || head[3], text: '' }
    } else if (current) {
      current.text += (current.text ? '\n' : '') + line.replace(/^[-*]\s*/, '')
    } else {
      sections.push({ title: 'AI 解读', text: line })
      current = null
    }
  }
  if (current) sections.push(current)
  return sections.length ? sections : [{ title: 'AI 解读', text: content }]
}

export async function generateAIReading(astrolabe, birthDateStr) {
  const ctx = buildFullChartContext(astrolabe, birthDateStr)
  const star = getMingStar(astrolabe)

  if (getApiKey() && canUseGptSettings()) {
    try {
      return { sections: await generateOpenAIReading(ctx), source: 'openai' }
    } catch (e) {
      return {
        sections: generateLocalAIReading(ctx, star),
        source: 'local',
        error: e.message
      }
    }
  }

  return { sections: generateLocalAIReading(ctx, star), source: 'local' }
}

export function renderAISections(sections, meta = {}) {
  const badge =
    meta.source === 'openai'
      ? '<span class="ai-badge ai-openai">AI 深度解盘</span>'
      : '<span class="ai-badge ai-local">智能解读</span>'

  let hint = ''
  if (!getApiKey()) {
    hint = canUseGptSettings()
      ? '<p class="panel-hint">在上方「GPT 设置」填入 API Key 即可启用 GPT 解盘。</p>'
      : ''
  }
  if (meta.error) {
    hint += `<p class="panel-hint ai-error">AI 调用失败：${meta.error}</p>`
  }

  const html = sections
    .map(
      (s) => `
    <article class="reading-item glass-inner ai-item">
      <h3 class="reading-title">${s.title}</h3>
      <p class="reading-text">${s.text.replace(/\n/g, '<br/>')}</p>
    </article>
  `
    )
    .join('')

  return `${badge}${hint}<div class="reading-list">${html}</div>`
}
