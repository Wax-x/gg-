const MUTAGEN_LABELS = ['禄', '权', '科', '忌']
const MUTAGEN_MEAN = {
  禄: '财缘、享受、机会增多',
  权: '掌控力、竞争、话语权',
  科: '名声、学习、贵人、考试',
  忌: '执着、反复、压力、钻牛角尖'
}

function getFunctionalPalace(astrolabe, name) {
  if (typeof astrolabe.palace === 'function') {
    return astrolabe.palace(name)
  }
  const raw = astrolabe.palaces.find((p) => p.name === name)
  return raw
}

function collectBirthMutagen(astrolabe) {
  const items = []
  for (const palace of astrolabe.palaces) {
    for (const star of [...(palace.majorStars || []), ...(palace.minorStars || [])]) {
      if (star.mutagen) {
        items.push({
          scope: '生年',
          star: star.name,
          mutagen: star.mutagen,
          palace: palace.name,
          stem: palace.heavenlyStem
        })
      }
    }
  }
  return items
}

function buildFlyingStars(astrolabe) {
  const flies = []
  for (const palace of astrolabe.palaces) {
    const fp = getFunctionalPalace(astrolabe, palace.name)
    if (!fp?.mutagedPlaces) continue
    const places = fp.mutagedPlaces()
    if (!places?.length) continue

    MUTAGEN_LABELS.forEach((label, i) => {
      const target = places[i]
      if (!target) return
      flies.push({
        from: palace.name,
        fromStem: palace.heavenlyStem,
        mutagen: label,
        to: target.name,
        meaning: MUTAGEN_MEAN[label]
      })
    })
  }
  return flies
}

function horoscopeMutagen(scope, item) {
  if (!item?.mutagen?.length) return []
  return item.mutagen.map((star, i) => ({
    scope,
    star,
    mutagen: MUTAGEN_LABELS[i] || '化',
    stem: item.heavenlyStem,
    branch: item.earthlyBranch
  }))
}

export function buildMutagenData(astrolabe, horoscope) {
  const birth = collectBirthMutagen(astrolabe)
  const decadal = horoscopeMutagen('大限', horoscope?.decadal)
  const yearly = horoscopeMutagen('流年', horoscope?.yearly)
  const flying = buildFlyingStars(astrolabe)

  return { birth, decadal, yearly, flying }
}

export function renderMutagenSection(data) {
  const { birth, decadal, yearly, flying } = data

  let html = '<div class="mutagen-groups">'

  const renderGroup = (title, items, formatter) => {
    if (!items.length) return ''
    return `
      <div class="mutagen-group glass-inner">
        <h3 class="mutagen-group-title">${title}</h3>
        <ul class="mutagen-list">
          ${items.map((it) => `<li>${formatter(it)}</li>`).join('')}
        </ul>
      </div>
    `
  }

  html += renderGroup(
    '生年四化（先天）',
    birth,
    (it) => `<strong>${it.star}化${it.mutagen}</strong> 在${it.palace} · ${MUTAGEN_MEAN[it.mutagen] || ''}`
  )

  html += renderGroup(
    '大限四化（当前十年）',
    decadal,
    (it) => `<strong>${it.star}化${it.mutagen}</strong>（${it.stem}${it.branch}大限）· ${MUTAGEN_MEAN[it.mutagen] || ''}`
  )

  html += renderGroup(
    '流年四化（今年）',
    yearly,
    (it) => `<strong>${it.star}化${it.mutagen}</strong>（${it.stem}${it.branch}流年）· ${MUTAGEN_MEAN[it.mutagen] || ''}`
  )

  if (flying.length) {
    html += `
      <div class="mutagen-group glass-inner">
        <h3 class="mutagen-group-title">四化飞星（宫干飞化）</h3>
        <p class="panel-hint">哪一宫的天干，让禄权科忌「飞」到哪一宫，代表能量从哪传到哪。</p>
        <ul class="mutagen-list">
          ${flying
            .map(
              (f) =>
                `<li><strong>${f.from}</strong>（${f.fromStem}）飞<strong>化${f.mutagen}</strong>入<strong>${f.to}</strong> · ${f.meaning}</li>`
            )
            .join('')}
        </ul>
      </div>
    `
  }

  html += '</div>'

  const summary = []
  if (birth.some((b) => b.mutagen === '忌')) {
    const ji = birth.find((b) => b.mutagen === '忌')
    summary.push(`生年化忌在${ji.palace}（${ji.star}），这一领域一辈子最容易反复纠结，宜提前修心、设边界。`)
  }
  if (decadal.some((d) => d.mutagen === '禄')) {
    summary.push('当前大限有化禄，十年内宜主动抓机会、拓展资源。')
  }
  if (yearly.some((y) => y.mutagen === '忌')) {
    summary.push('今年流年有化忌，大事宜稳不宜急，合同账目多核对。')
  }
  if (!summary.length) {
    summary.push('四化整体较平衡，重点仍看主星与格局；化禄权科忌随大限流年轮流激活。')
  }

  return { html, summary: summary.join(' ') }
}
