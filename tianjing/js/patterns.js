function findPalace(astrolabe, name) {
  return astrolabe.palaces.find((p) => p.name === name)
}

function majorIn(palace, ...stars) {
  if (!palace) return false
  const names = (palace.majorStars || []).map((s) => s.name)
  return stars.every((s) => names.includes(s))
}

function hasMajor(astrolabe, palaceName, star) {
  return majorIn(findPalace(astrolabe, palaceName), star)
}

function hasMajorAnywhere(astrolabe, star) {
  return astrolabe.palaces.some((p) =>
    (p.majorStars || []).some((s) => s.name === star)
  )
}

function starsTogether(palace, ...stars) {
  if (!palace) return false
  const names = (palace.majorStars || []).map((s) => s.name)
  return stars.every((s) => names.includes(s))
}

function hasMinor(palace, star) {
  if (!palace) return false
  return (palace.minorStars || []).some((s) => s.name === star)
}

function mingEmpty(astrolabe) {
  const ming = findPalace(astrolabe, '命宫')
  return ming && !(ming.majorStars || []).length
}

function checkPatterns(astrolabe) {
  const patterns = []
  const ming = findPalace(astrolabe, '命宫')
  const caibo = findPalace(astrolabe, '财帛')
  const guanlu = findPalace(astrolabe, '官禄')
  const fuqi = findPalace(astrolabe, '夫妻')
  const qianyi = findPalace(astrolabe, '迁移')

  if (starsTogether(ming, '紫微', '天府')) {
    patterns.push({
      name: '紫府同宫',
      level: '大吉',
      text: '紫微天府同守命宫，为「君臣庆会」之贵格。主气度宽宏、有统御与守成之能，一生多得资源与地位，宜政商管理及大型组织。'
    })
  }

  if (hasMajor(astrolabe, '命宫', '紫微') && hasMajorAnywhere(astrolabe, '天府')) {
    const ziweiPalace = astrolabe.palaces.find((p) =>
      (p.majorStars || []).some((s) => s.name === '紫微')
    )
    const tianfuPalace = astrolabe.palaces.find((p) =>
      (p.majorStars || []).some((s) => s.name === '天府')
    )
    if (ziweiPalace && tianfuPalace && !starsTogether(ming, '紫微', '天府')) {
      patterns.push({
        name: '紫府朝垣',
        level: '吉',
        text: '紫微天府分守，互相呼应，主贵而不孤。有领导才能亦懂守成，事业与财富可兼顾。'
      })
    }
  }

  if (
    (hasMajor(astrolabe, '命宫', '太阳') && hasMajorAnywhere(astrolabe, '太阴')) ||
    (hasMajor(astrolabe, '命宫', '太阴') && hasMajorAnywhere(astrolabe, '太阳'))
  ) {
    patterns.push({
      name: '日月并明',
      level: '吉',
      text: '太阳太阴会照命盘，主阴阳调和、男女缘佳。若入庙旺，则清贵有名；主思维与情感并重，宜公关、教育、艺术。'
    })
  }

  const jiyue = ['天机', '太阴', '天同', '天梁'].filter(hasMajorAnywhere.bind(null, astrolabe))
  if (jiyue.length >= 3) {
    patterns.push({
      name: '机月同梁',
      level: '平',
      text: `机月同梁星曜会聚（见${jiyue.join('、')}），为典型「清贵之格」。宜公职、教育、法律、医疗等稳定体系，不宜投机冒险。`
    })
  }

  const shapolang = ['七杀', '破军', '贪狼'].filter((s) => hasMajor(astrolabe, '命宫', s))
  if (shapolang.length) {
    patterns.push({
      name: '杀破狼',
      level: '变动',
      text: `命宫见${shapolang.join('、')}，为杀破狼格局。人生变动大、开创力强，宜主动求变，忌墨守成规。大起大落中见成就。`
    })
  }

  for (const palace of astrolabe.palaces) {
    if (starsTogether(palace, '贪狼') && hasMinor(palace, '火星')) {
      patterns.push({
        name: '火贪格',
        level: '大吉',
        text: '贪狼遇火星，为「火贪爆发」之格。主突发机遇、横发之机，宜把握短期风口，但需防来得快去得快。'
      })
      break
    }
    if (starsTogether(palace, '贪狼') && hasMinor(palace, '铃星')) {
      patterns.push({
        name: '铃贪格',
        level: '吉',
        text: '贪狼遇铃星，亦主暴发机遇，但较火贪更为潜伏突发，宜长期布局后一击即中。'
      })
      break
    }
  }

  if (starsTogether(ming, '廉贞', '七杀')) {
    patterns.push({
      name: '廉杀同宫',
      level: '煞',
      text: '廉贞七杀同守命宫，为「路上埋尸」之格（需参煞曜轻重）。主刚烈冒险，事业多竞争与血光，宜军警、外科、竞技。'
    })
  }

  if (hasMajor(astrolabe, '官禄', '天府') && hasMajorAnywhere(astrolabe, '天相')) {
    patterns.push({
      name: '府相朝垣',
      level: '吉',
      text: '天府天相会照，主事业稳定、得人信任。宜行政、金融、大型机构，仕途或管理路线顺遂。'
    })
  }

  if (hasMajor(astrolabe, '命宫', '武曲') && hasMinor(caibo, '禄存')) {
    patterns.push({
      name: '禄马交驰',
      level: '吉',
      text: '武曲禄存会照，财星得位。主正财丰隆、善于积累，宜金融、实业、技术求财。'
    })
  }

  if (hasMinor(ming, '禄存') && hasMinor(ming, '天马')) {
    patterns.push({
      name: '禄马交驰',
      level: '吉',
      text: '禄存天马同宫，主远方求财、动中求财。越动越有机会，宜贸易、物流、跨区业务。'
    })
  }

  if (mingEmpty(astrolabe)) {
    patterns.push({
      name: '命无正曜',
      level: '平',
      text: '命宫无主星，借对宫与三方四正定格局。人生方向受环境与他人影响较大，宜借贵人之力，灵活适应。'
    })
  }

  const allMutagen = []
  for (const p of astrolabe.palaces) {
    for (const s of [...(p.majorStars || []), ...(p.minorStars || [])]) {
      if (s.mutagen) allMutagen.push(`${s.name}化${s.mutagen}`)
    }
  }
  if (allMutagen.length) {
    patterns.push({
      name: '四化飞星',
      level: '提示',
      text: `本命四化为：${allMutagen.join('、')}。化禄主财与缘，化权主掌控与竞争，化科主名声与考试，化忌主执着与波折。`
    })
  }

  if (!patterns.length) {
    patterns.push({
      name: '平和之格',
      level: '平',
      text: '命盘未见显著特殊格局，属平稳发展型。宜依命宫主星与官禄、财帛三方定方向，随大限流年逐步展开。'
    })
  }

  return patterns
}

export function analyzePatterns(astrolabe) {
  return checkPatterns(astrolabe)
}

export function buildPatternSummary(patterns) {
  const ji = patterns.filter((p) => p.level === '大吉' || p.level === '吉')
  const bian = patterns.filter((p) => p.level === '变动' || p.level === '煞')
  let summary = `命盘共识别 ${patterns.length} 项格局特征。`
  if (ji.length) summary += ` 吉格：${ji.map((p) => p.name).join('、')}。`
  if (bian.length) summary += ` 需留意：${bian.map((p) => p.name).join('、')}。`
  return summary
}
