export function renderPalaceCell(palace, isMing) {
  const major = palace.majorStars.map((s) => s.name).filter(Boolean)
  const minor = palace.minorStars?.slice(0, 4).map((s) => s.name).filter(Boolean) || []
  const mutagen = [...(palace.majorStars || []), ...(palace.minorStars || [])]
    .filter((s) => s.mutagen)
    .map((s) => `${s.name}${s.mutagen}`)

  const starsHtml = major.length
    ? major.map((s) => `<span class="star-major">${s}</span>`).join('')
    : '<span class="star-empty">空宫</span>'

  const minorHtml = minor.map((s) => `<span class="star-minor">${s}</span>`).join('')
  const mutagenHtml = mutagen.map((s) => `<span class="star-mutagen">${s}</span>`).join('')

  return `
    <div class="palace-cell glass-inner ${isMing ? 'palace-ming' : ''}" data-branch="${palace.earthlyBranch}">
      <div class="palace-head">
        <span class="palace-name">${palace.name}</span>
        <span class="palace-gz">${palace.heavenlyStem}${palace.earthlyBranch}</span>
      </div>
      <div class="palace-stars">${starsHtml}${minorHtml}${mutagenHtml}</div>
    </div>
  `
}

const CHART_LAYOUT = [
  ['巳', '午', '未', '申'],
  ['辰', null, null, '酉'],
  ['卯', null, null, '戌'],
  ['寅', '丑', '子', '亥']
]

export function renderChart(astrolabe) {
  const grid = document.getElementById('chartGrid')
  grid.innerHTML = ''

  const byBranch = Object.fromEntries(
    astrolabe.palaces.map((p) => [p.earthlyBranch, p])
  )

  let centerAdded = false

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const branch = CHART_LAYOUT[row][col]

      if (branch === null) {
        if (!centerAdded && row === 1 && col === 1) {
          const center = document.createElement('div')
          center.className = 'chart-center glass-inner'
          center.innerHTML = `
            <p class="center-title">天晶观命</p>
            <p class="center-meta">${astrolabe.gender || ''}</p>
            <p class="center-meta">${astrolabe.lunarDate || ''}</p>
            <p class="center-five">${astrolabe.fiveElementsClass || ''}</p>
          `
          grid.appendChild(center)
          centerAdded = true
        }
        continue
      }

      const palace = byBranch[branch]
      if (!palace) continue

      const cell = document.createElement('div')
      cell.className = 'chart-cell'
      cell.innerHTML = renderPalaceCell(palace, palace.name === '命宫')
      grid.appendChild(cell)
    }
  }
}
