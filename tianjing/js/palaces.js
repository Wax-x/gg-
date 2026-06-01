import { plainPalaceReading } from './palace-simple.js'

function getOppositePalace(astrolabe, palace) {
  const idx = astrolabe.palaces.findIndex((p) => p.name === palace.name)
  if (idx < 0) return null
  return astrolabe.palaces[(idx + 6) % 12]
}

function getPalaceStars(palace) {
  const major = (palace.majorStars || []).map((s) => s.name).filter(Boolean)
  const minor = (palace.minorStars || []).slice(0, 4).map((s) => s.name).filter(Boolean)
  const mutagen = [...(palace.majorStars || []), ...(palace.minorStars || [])]
    .filter((s) => s.mutagen)
    .map((s) => `${s.name}化${s.mutagen}`)
  return { major, minor, mutagen }
}

function buildPalaceText(astrolabe, palace) {
  const { major, minor, mutagen } = getPalaceStars(palace)
  const opposite = getOppositePalace(astrolabe, palace)
  const oppMajor = opposite
    ? (opposite.majorStars || []).map((s) => s.name).filter(Boolean)
    : []

  let text = plainPalaceReading(palace.name, major, oppMajor)

  if (mutagen.length) {
    text += `\n\n📌 本宫四化：${mutagen.join('、')}——该领域会更有「执念」或「转折」，遇事别钻牛角尖。`
  }

  if (minor.length && major.length) {
    text += `\n\n✨ 辅助星：${minor.join('、')}，会在细节上加分或带来小变数。`
  }

  return text
}

export function buildAllPalaceReadings(astrolabe) {
  return astrolabe.palaces.map((palace) => {
    const { major, minor } = getPalaceStars(palace)
    const starsLabel = major.length
      ? major.join('、')
      : minor.length
        ? `空宫（辅：${minor.slice(0, 3).join('、')}）`
        : '空宫'

    return {
      title: `${palace.name} · ${starsLabel}`,
      subtitle: `${palace.heavenlyStem}${palace.earthlyBranch}`,
      text: buildPalaceText(astrolabe, palace),
      isMing: palace.name === '命宫'
    }
  })
}

export function buildSummary(astrolabe) {
  const ming = astrolabe.palaces.find((p) => p.name === '命宫')
  if (!ming) return null

  const mainStar = ming.majorStars[0]?.name
  const text = mainStar
    ? `你的命宫主星是${mainStar}，${astrolabe.fiveElementsClass || ''}为底色。下面逐宫用大白话说明——对照现实生活看即可，不必当「宿命」。`
    : `命宫无主星，整体格局借对宫与三方星曜而定，${astrolabe.fiveElementsClass || ''}为底色。下面逐宫用大白话说明。`

  return {
    title: '怎么读这份解读？',
    subtitle: '通俗版 · 贴近生活',
    text,
    isMing: false
  }
}
