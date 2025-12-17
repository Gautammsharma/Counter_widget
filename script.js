const wheelNumber = document.getElementById('wheelNumber')
const minusBtn = document.querySelector('.minus')
const plusBtn = document.querySelector('.plus')

let value = 2
const MIN = 0
const MAX = 99

/* ==========================
   SOUND + HAPTIC
========================== */

let audioUnlocked = false
const tickSound = new Audio(
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
)
tickSound.volume = 0.18

document.addEventListener(
  'pointerdown',
  () => {
    if (audioUnlocked) return
    tickSound.play().then(() => {
      tickSound.pause()
      tickSound.currentTime = 0
      audioUnlocked = true
    }).catch(() => {})
  },
  { once: true }
)

function haptic() {
  if (navigator.vibrate) navigator.vibrate(6)
}

function playTick() {
  if (!audioUnlocked) return
  tickSound.currentTime = 0
  tickSound.play().catch(() => {})
}

/* ==========================
   STATE
========================== */

let animating = false
let queuedDelta = 0

function updateButtons() {
  minusBtn.classList.toggle('disabled', value <= MIN)
  plusBtn.classList.toggle('disabled', value >= MAX)
}

/* ==========================
   APPLE-STYLE HORIZONTAL ROLL
========================== */

function rollNumber(delta) {
  if (
    (delta < 0 && value <= MIN) ||
    (delta > 0 && value >= MAX)
  ) return

  if (animating) {
    queuedDelta += delta
    return
  }

  animating = true
  value += delta

  const oldNum = wheelNumber.querySelector('.num')
  const newNum = document.createElement('div')
  newNum.className = 'num'
  newNum.textContent = value

  const dir = delta > 0 ? 1 : -1

  // Start outside horizontally
  newNum.style.transform = `translateX(${dir * 120}%)`
  newNum.style.opacity = '0'
  newNum.style.filter = 'blur(6px)'

  wheelNumber.appendChild(newNum)

  requestAnimationFrame(() => {
    // Old slides out
    oldNum.style.transform = `translateX(${-dir * 120}%)`
    oldNum.style.opacity = '0'
    oldNum.style.filter = 'blur(6px)'

    // New slides in
    newNum.style.transform = 'translateX(0)'
    newNum.style.opacity = '1'
    newNum.style.filter = 'blur(0px)'
  })

  playTick()
  haptic()
  updateButtons()

  setTimeout(() => {
    oldNum.remove()
    animating = false

    if (queuedDelta !== 0) {
      const next = Math.sign(queuedDelta)
      queuedDelta -= next
      rollNumber(next)
    }
  }, 380)
}

/* ==========================
   TAP + LONG PRESS
========================== */

let holdTimeout = null
let holdInterval = null
let holdSpeed = 280
let didHold = false
let activeDelta = 0

function startPress(delta) {
  activeDelta = delta
  didHold = false

  holdTimeout = setTimeout(() => {
    didHold = true
    holdSpeed = 280

    const step = () => {
      rollNumber(activeDelta)

      // subtle sub-pixel polish
      wheelNumber.style.transform = 'translateX(0.4px)'
      setTimeout(() => {
        wheelNumber.style.transform = 'translateX(0)'
      }, 60)

      holdSpeed = Math.max(70, holdSpeed * 0.85)
      holdInterval = setTimeout(step, holdSpeed)
    }

    step()
  }, 180)
}

function endPress() {
  clearTimeout(holdTimeout)
  clearTimeout(holdInterval)

  if (!didHold && activeDelta !== 0) {
    rollNumber(activeDelta)
  }

  activeDelta = 0
  didHold = false
}

/* ==========================
   EVENTS
========================== */

plusBtn.addEventListener('pointerdown', () => startPress(1))
minusBtn.addEventListener('pointerdown', () => startPress(-1))

document.addEventListener('pointerup', endPress)
document.addEventListener('pointerleave', endPress)

updateButtons()
