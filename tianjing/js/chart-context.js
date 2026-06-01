import { analyzePatterns } from './patterns.js'
import { buildHoroscopeData } from './horoscope.js'
import { buildMutagenData } from './mutagen.js'

function fmtPalace(p) {
  if (!p) return ''
  const major = (p.majorStars || []).map((s) => s.name).join('、') || '空宫'
  const mutagen = [...(p.majorStars || []), ...(p.minorStars || [])]
    .filter((s) => s.mutagen)
    .map((s) => `${s.name}化${s.mutagen}`)
  return `${p.name}（${p.heavenlyStem}${p.earthlyBranch}）主星：${major}${mutagen.length ? `，四化：${mutagen.join('、')}` : ''}`
}

export function buildFullChartContext(astrolabe, birthDateStr) {
  const patterns = analyzePatterns(astrolabe)
  const horoscopeData = buildHoroscopeData(astrolabe, birthDateStr)
  const mutagenData = buildMutagenData(astrolabe, horoscopeData.horoscope)

  const palaceLines = astrolabe.palaces.map((p) => fmtPalace(p)).join('\n')

  const birthMutagen = mutagenData.birth
    .map((m) => `${m.star}化${m.mutagen}在${m.palace}`)
    .join('、')

  const ctx = {
    gender: astrolabe.gender,
    solar: astrolabe.solarDate,
    lunar: astrolabe.lunarDate,
    pillars: astrolabe.chineseDate,
    fiveElements: astrolabe.fiveElementsClass,
    zodiac: astrolabe.zodiac,
    sign: astrolabe.sign,
    ming: fmtPalace(astrolabe.palaces.find((p) => p.name === '命宫')),
    caibo: fmtPalace(astrolabe.palaces.find((p) => p.name === '财帛')),
    guanlu: fmtPalace(astrolabe.palaces.find((p) => p.name === '官禄')),
    fuqi: fmtPalace(astrolabe.palaces.find((p) => p.name === '夫妻')),
    patterns: patterns.map((p) => `${p.name}(${p.level})`).join('、') || '平和之格',
    decadal: horoscopeData.defaultDetail
      ? `${horoscopeData.defaultDetail.range[0]}-${horoscopeData.defaultDetail.range[1]}岁走${horoscopeData.defaultDetail.palaceName}，主星${horoscopeData.defaultDetail.starsLabel}`
      : '',
    yearly: horoscopeData.yearlyReading,
    birthMutagen,
    palaceLines,
    patternsList: patterns
  }

  ctx.systemText = `【用户命盘摘要】
性别：${ctx.gender}
阳历：${ctx.solar} | 农历：${ctx.lunar}
四柱：${ctx.pillars}
五行局：${ctx.fiveElements} | 生肖：${ctx.zodiac} | 星座：${ctx.sign}

【重点宫位】
命宫：${ctx.ming}
财帛：${ctx.caibo}
官禄：${ctx.guanlu}
夫妻：${ctx.fuqi}

【格局】${ctx.patterns}
【生年四化】${ctx.birthMutagen || '无'}
【当前大限】${ctx.decadal}
【今年流年】${ctx.yearly}

【十二宫一览】
${ctx.palaceLines}`

  return ctx
}

export function getMingStar(astrolabe) {
  const ming = astrolabe.palaces.find((p) => p.name === '命宫')
  return ming?.majorStars?.[0]?.name || null
}
