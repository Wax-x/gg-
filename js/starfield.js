export class Starfield {
  constructor(canvas, theme = 'dark') {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.theme = theme
    this.particles = []
    this.rafId = null
    this.resize = this.resize.bind(this)
    window.addEventListener('resize', this.resize)
    this.resize()
    this.createParticles(100)
    this.animate()
  }

  setTheme(theme) {
    this.theme = theme
  }

  starColor(opacity) {
    return this.theme === 'light'
      ? `rgba(20, 20, 20, ${opacity})`
      : `rgba(255, 255, 255, ${opacity})`
  }

  resize() {
    const dpr = window.devicePixelRatio || 1
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width * dpr
    this.canvas.height = this.height * dpr
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  createParticles(count) {
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.55 + 0.15,
      speed: Math.random() * 0.25 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.01
    }))
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    for (const p of this.particles) {
      p.y -= p.speed
      p.twinkle += p.twinkleSpeed
      if (p.y < -4) {
        p.y = this.height + 4
        p.x = Math.random() * this.width
      }
      const alpha = p.opacity * (0.55 + 0.45 * Math.sin(p.twinkle))
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      this.ctx.fillStyle = this.starColor(alpha)
      this.ctx.fill()
    }
  }

  animate() {
    this.draw()
    this.rafId = requestAnimationFrame(() => this.animate())
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.resize)
  }
}
