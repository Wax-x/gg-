import { plainPalaceReading, STAR_PALACE_PLAIN, PALACE_INTRO } from './palace-simple.js'

function calcAge(birthDateStr, refDate = new Date()) {
  const birth = new Date(birthDateStr)
  let age = refDate.getFullYear() - birth.getFullYear()
  const m = refDate.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) age -= 1
  return age
}

function findPalace(astrolabe, palaceName) {
  return astrolabe.palaces.find((p) => p.name === palaceName)
}

function findCurrentDecadal(astrolabe, age) {
  for (const palace of astrolabe.palaces) {
    const range = palace.decadal?.range
    if (range && age >= range[0] && age <= range[1]) {
      return { palace, range }
    }
  }
  return null
}

function getDecadalStatus(range, age) {
  if (age >= range[0] && age <= range[1]) return 'current'
  if (age < range[0]) return 'future'
  return 'past'
}

const STATUS_LABEL = {
  current: '当前大限',
  past: '已过往',
  future: '未到来'
}

const PALACE_FOCUS = {
  命宫: { tags: ['个人成长', '人生方向', '整体运势'], advice: '这十年「你自己」是主角，适合定人设、换赛道、做长期规划。' },
  兄弟: { tags: ['同事', '合伙人', '朋友'], advice: '平辈关系影响大，合伙、团队协作要先把规则讲清楚。' },
  夫妻: { tags: ['恋爱', '婚姻', '合作伴侣'], advice: '感情与一对一关系是关键词，单身宜主动社交，有伴宜深度沟通。' },
  子女: { tags: ['子女', '投资', '创意'], advice: '适合培养新技能、做副业或投资，也关注晚辈/下属关系。' },
  财帛: { tags: ['收入', '理财', '消费'], advice: '赚钱方式和财务习惯会被放大，宜记帐、控杠杆、建应急金。' },
  疾厄: { tags: ['健康', '压力', '作息'], advice: '身体和心理负担易显化，体检、运动、睡眠不要省。' },
  迁移: { tags: ['外出', '搬迁', '进修'], advice: '适合走出去——换城市、出差、留学、拓展外地资源。' },
  仆役: { tags: ['团队', '人脉', '下属'], advice: '谁帮你、谁拖你，这十年会很明显，慎选圈子。' },
  交友: { tags: ['团队', '人脉', '下属'], advice: '谁帮你、谁拖你，这十年会很明显，慎选圈子。' },
  官禄: { tags: ['事业', '职涯', '名声'], advice: '工作运高峰，宜争取晋升、换更好的平台或认真创业。' },
  田宅: { tags: ['房产', '家庭', '积蓄'], advice: '适合改善居住、处理家庭事务、做长线资产布局。' },
  福德: { tags: ['心态', '兴趣', '生活质量'], advice: '「开不开心」变得重要，培养爱好，别只拼 KPI。' },
  父母: { tags: ['长辈', '上司', '学历'], advice: '长辈、领导、证件考试等议题突出，宜维护上级关系。' }
}

function buildDecadalDetail(astrolabe, palaceName, age) {
  const palace = findPalace(astrolabe, palaceName)
  if (!palace?.decadal?.range) return null

  const range = palace.decadal.range
  const status = getDecadalStatus(range, age)
  const major = (palace.majorStars || []).map((s) => s.name)
  const minor = (palace.minorStars || []).slice(0, 4).map((s) => s.name)
  const mutagen = [...(palace.majorStars || []), ...(palace.minorStars || [])]
    .filter((s) => s.mutagen)
    .map((s) => `${s.name}化${s.mutagen}`)

  const focus = PALACE_FOCUS[palace.name] || {
    tags: [palace.name],
    advice: `这十年${palace.name}所主事项会是生活重心。`
  }

  const starReading = major.length
    ? major
        .map((s) => STAR_PALACE_PLAIN[s]?.[palace.name] || `主星${s}在此，会按${s}的特质影响这十年。`)
        .join(' ')
    : '无主星，运势较借对宫与流年激活，起伏随环境而定。'

  const intro = PALACE_INTRO[palace.name] || ''

  return {
    palaceName: palace.name,
    gz: `${palace.heavenlyStem}${palace.earthlyBranch}`,
    range,
    status,
    statusLabel: STATUS_LABEL[status],
    major,
    minor,
    mutagen,
    starsLabel: major.length ? major.join('、') : '空宫',
    focus,
    intro,
    starReading,
    plainText: plainPalaceReading(palace.name, major, [])
  }
}

function plainYearlyReading(horoscope, astrolabe) {
  const y = horoscope.yearly
  if (!y) return '流年数据暂不可用。'

  const palace = astrolabe.palaces[y.index]
  if (!palace) return '流年宫位解析失败。'

  const major = (palace.majorStars || []).map((s) => s.name)
  const stars = major.length ? major.join('、') : '空宫'
  const mutagen = (y.mutagen || [])
    .map((s, i) => (s ? `${s}化${['禄', '权', '科', '忌'][i]}` : null))
    .filter(Boolean)

  let text = `${horoscope.solarDate?.slice(0, 4) || '今年'}流年走${palace.name}（${y.heavenlyStem}${y.earthlyBranch}），主星：${stars}。`
  text += ' 这一年该领域的事会被推到前台。'

  if (mutagen.length) {
    text += ` 流年四化：${mutagen.join('、')}。`
    if (mutagen.some((m) => m.includes('忌'))) text += '今年宜稳不宜冒进。'
    else if (mutagen.some((m) => m.includes('禄'))) text += '今年宜主动争取机会。'
  }

  return text
}

export function buildHoroscopeData(astrolabe, birthDateStr) {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const horoscope = astrolabe.horoscope(dateStr)
  const age = calcAge(birthDateStr, today)
  const currentDecadal = findCurrentDecadal(astrolabe, age)

  const decadalList = astrolabe.palaces
    .filter((p) => p.decadal?.range)
    .map((p) => {
      const detail = buildDecadalDetail(astrolabe, p.name, age)
      return {
        palaceName: p.name,
        gz: detail.gz,
        range: p.decadal.range,
        stars: detail.starsLabel,
        status: detail.status,
        isCurrent: detail.status === 'current'
      }
    })
    .sort((a, b) => a.range[0] - b.range[0])

  const defaultPalace = currentDecadal?.palace?.name || decadalList[0]?.palaceName
  const defaultDetail = defaultPalace ? buildDecadalDetail(astrolabe, defaultPalace, age) : null

  return {
    horoscope,
    age,
    birthDateStr,
    currentDecadal,
    decadalList,
    defaultPalace,
    defaultDetail,
    yearlyReading: plainYearlyReading(horoscope, astrolabe),
    nominalAge: horoscope.age?.nominalAge
  }
}

export function renderDecadalDetail(detail) {
  if (!detail) return '<p class="empty-hint">暂无大限数据</p>'

  const tags = detail.focus.tags.map((t) => `<span class="focus-tag">${t}</span>`).join('')
  const mutagenHtml = detail.mutagen.length
    ? `<p class="detail-row"><strong>四化：</strong>${detail.mutagen.join('、')}</p>`
    : ''
  const minorHtml = detail.minor.length
    ? `<p class="detail-row"><strong>辅星：</strong>${detail.minor.join('、')}</p>`
    : ''

  return `
    <div class="decadal-detail-inner">
      <div class="decadal-detail-head">
        <div>
          <h3 class="decadal-detail-title">${detail.range[0]}–${detail.range[1]}岁 · ${detail.palaceName}</h3>
          <p class="decadal-detail-gz">${detail.gz} · 主星：${detail.starsLabel}</p>
        </div>
        <span class="decadal-status-badge status-${detail.status}">${detail.statusLabel}</span>
      </div>
      <div class="focus-tags">${tags}</div>
      <p class="reading-text">${detail.intro}</p>
      <p class="reading-text detail-highlight">${detail.focus.advice}</p>
      <p class="reading-text">${detail.starReading}</p>
      ${mutagenHtml}
      ${minorHtml}
      <details class="decadal-more">
        <summary>展开完整解读</summary>
        <p class="reading-text reading-plain">${detail.plainText.replace(/\n/g, '<br/>')}</p>
      </details>
    </div>
  `
}

export function renderHoroscopeSection(data) {
  const { decadalList, defaultDetail, yearlyReading, age, nominalAge, horoscope, defaultPalace } = data

  const timeline = decadalList
    .map(
      (d) => `
      <button
        type="button"
        class="decadal-item glass-inner decadal-selectable ${d.isCurrent ? 'decadal-current' : ''} ${d.palaceName === defaultPalace ? 'decadal-selected' : ''}"
        data-palace="${d.palaceName}"
        aria-pressed="${d.palaceName === defaultPalace}"
      >
        <div class="decadal-head">
          <span class="decadal-range">${d.range[0]}–${d.range[1]}岁</span>
          <span class="decadal-status-mini status-${d.status}">${STATUS_LABEL[d.status]}</span>
        </div>
        <p class="decadal-palace">${d.palaceName} · ${d.gz}</p>
        <p class="decadal-stars">主星：${d.stars}</p>
      </button>
    `
    )
    .join('')

  return `
    <div class="horoscope-summary glass-inner">
      <p><strong>虚岁 ${nominalAge ?? age} 岁</strong>（周岁约 ${age} 岁）</p>
      <p class="reading-text yearly-highlight">${yearlyReading}</p>
      <p class="panel-hint">流年参考：${horoscope.solarDate} · 点击下方大限可切换查看</p>
    </div>

    <div class="decadal-detail glass-inner" id="decadalDetail">
      ${renderDecadalDetail(defaultDetail)}
    </div>

    <h3 class="sub-title">大限时间表 · 点击切换</h3>
    <div class="decadal-timeline" id="decadalTimeline">${timeline}</div>
  `
}

export function bindDecadalTimeline(astrolabe, data, rootEl) {
  const timeline = rootEl.querySelector('#decadalTimeline')
  const detailEl = rootEl.querySelector('#decadalDetail')
  if (!timeline || !detailEl) return

  const select = (palaceName) => {
    const detail = buildDecadalDetail(astrolabe, palaceName, data.age)
    detailEl.innerHTML = renderDecadalDetail(detail)
    detailEl.classList.remove('detail-flash')
    requestAnimationFrame(() => detailEl.classList.add('detail-flash'))

    timeline.querySelectorAll('.decadal-selectable').forEach((btn) => {
      const active = btn.dataset.palace === palaceName
      btn.classList.toggle('decadal-selected', active)
      btn.setAttribute('aria-pressed', String(active))
    })
  }

  timeline.addEventListener('click', (e) => {
    const btn = e.target.closest('.decadal-selectable')
    if (!btn) return
    select(btn.dataset.palace)
  })

  return { select }
}
