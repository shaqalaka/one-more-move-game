(() => {
  'use strict'

  const N = 1, E = 2, S = 4, W = 8
  const DIRS = [
    {bit: N, opposite: S, dr: -1, dc: 0, name: 'north'},
    {bit: E, opposite: W, dr: 0, dc: 1, name: 'east'},
    {bit: S, opposite: N, dr: 1, dc: 0, name: 'south'},
    {bit: W, opposite: E, dr: 0, dc: -1, name: 'west'}
  ]
  const SIZE = 5
  const STORAGE_KEY = 'one-more-move.profile.v1'
  const ACTIVE_KEY = 'one-more-move.active.v1'
  const TILE_SET = [N | S, E | W, N | E, E | S, S | W, W | N, N | E | S, E | S | W, S | W | N, W | N | E]

  const $ = selector => document.querySelector(selector)
  const elements = {
    menu: $('#menu-screen'), game: $('#game-screen'), board: $('#board'), moves: $('#moves'), hints: $('#hints'),
    score: $('#score'), energy: $('#energy-fill'), source: $('#source'), target: $('#target'), help: $('#board-help'),
    mode: $('#mode-label'), play: $('#play-button'), continue: $('#continue-button'), daily: $('#daily-button'), dailyStatus: $('#daily-status'),
    home: $('#home-button'), sound: $('#sound-button'), undo: $('#undo-button'), hint: $('#hint-button'),
    restart: $('#restart-button'), tutorial: $('#tutorial-modal'), tutorialPlay: $('#tutorial-play'), how: $('#how-button'), reset: $('#reset-button'),
    lastModal: $('#last-move-modal'), lastButton: $('#last-move-button'), giveUp: $('#give-up-button'),
    result: $('#result-modal'), resultMark: $('#result-mark'), resultKicker: $('#result-kicker'), resultTitle: $('#result-title'),
    resultScore: $('#result-score'), resultDetail: $('#result-detail'), next: $('#next-button'), share: $('#share-button'),
    toast: $('#toast'), wins: $('#stat-wins'), streak: $('#stat-streak'), best: $('#stat-best')
  }

  let profile = loadProfile()
  let state = null
  let audioContext = null

  function defaultProfile() {
    return {wins: 0, best: 0, dailyStreak: 0, lastDaily: '', dailyScores: {}, muted: false, tutorialSeen: false}
  }

  function loadProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      const clean = Object.assign(defaultProfile(), saved && typeof saved === 'object' ? saved : {})
      if (!clean.dailyScores || typeof clean.dailyScores !== 'object' || Array.isArray(clean.dailyScores)) clean.dailyScores = {}
      return clean
    } catch (_) {
      return defaultProfile()
    }
  }

  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch (_) {}
  }

  function saveActive() {
    try {
      if (!state || state.over) localStorage.removeItem(ACTIVE_KEY)
      else localStorage.setItem(ACTIVE_KEY, JSON.stringify(state))
    } catch (_) {}
  }

  function loadActive() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null')
      if (!saved || saved.over || !Array.isArray(saved.tiles) || saved.tiles.length !== SIZE * SIZE || !Array.isArray(saved.path)) return null
      return saved
    } catch (_) {
      try { localStorage.removeItem(ACTIVE_KEY) } catch (_) {}
      return null
    }
  }

  function hashSeed(value) {
    let h = 2166136261
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  function mulberry32(seed) {
    return () => {
      seed |= 0
      seed = seed + 0x6D2B79F5 | 0
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }

  function todayKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  }

  function yesterdayKey() {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - 1)
    return todayKey(date)
  }

  function rotateMask(mask, turns = 1) {
    let result = mask
    for (let i = 0; i < turns; i++) result = ((result << 1) & 15) | ((result & W) ? N : 0)
    return result
  }

  function turnsTo(current, target) {
    for (let turns = 0; turns < 4; turns++) if (rotateMask(current, turns) === target) return turns
    return 4
  }

  function indexOf(row, col) { return row * SIZE + col }

  function generatePath(rng) {
    const path = []
    let row = Math.floor(rng() * SIZE)
    path.push([row, 0])
    for (let col = 0; col < SIZE - 1; col++) {
      if (rng() < 0.72) {
        const choices = []
        if (row > 0) choices.push(-1)
        if (row < SIZE - 1) choices.push(1)
        const direction = choices[Math.floor(rng() * choices.length)]
        const steps = rng() < 0.28 ? 2 : 1
        for (let step = 0; step < steps; step++) {
          const nextRow = row + direction
          if (nextRow < 0 || nextRow >= SIZE) break
          row = nextRow
          path.push([row, col])
        }
      }
      path.push([row, col + 1])
    }
    if (rng() < 0.45) {
      const direction = row === 0 ? 1 : row === SIZE - 1 ? -1 : rng() < .5 ? -1 : 1
      row += direction
      path.push([row, SIZE - 1])
    }
    return path.filter((cell, i, list) => i === 0 || cell[0] !== list[i - 1][0] || cell[1] !== list[i - 1][1])
  }

  function directionBit(from, to) {
    if (to[0] < from[0]) return N
    if (to[1] > from[1]) return E
    if (to[0] > from[0]) return S
    return W
  }

  function buildPuzzle(seed, mode) {
    const rng = mulberry32(hashSeed(seed))
    let candidate
    for (let attempt = 0; attempt < 60; attempt++) {
      const path = generatePath(rng)
      const pathMap = new Map(path.map((cell, i) => [indexOf(cell[0], cell[1]), i]))
      const tiles = Array.from({length: SIZE * SIZE}, (_, index) => {
        const pathIndex = pathMap.get(index)
        if (pathIndex === undefined) {
          const target = TILE_SET[Math.floor(rng() * TILE_SET.length)]
          return {mask: rotateMask(target, Math.floor(rng() * 4)), target, path: false}
        }
        const cell = path[pathIndex]
        let target = 0
        if (pathIndex === 0) target |= W
        else target |= directionBit(cell, path[pathIndex - 1])
        if (pathIndex === path.length - 1) target |= E
        else target |= directionBit(cell, path[pathIndex + 1])
        const rotation = Math.floor(rng() * 4)
        return {mask: rotateMask(target, rotation), target, path: true}
      })
      const required = tiles.reduce((sum, tile) => sum + (tile.path ? turnsTo(tile.mask, tile.target) : 0), 0)
      candidate = {seed, mode, path, tiles, sourceRow: path[0][0], targetRow: path[path.length - 1][0], required}
      if (required >= 6 && !tracePower(candidate).won) break
    }
    const cushion = mode === 'daily' ? 4 : 5
    candidate.initialMasks = candidate.tiles.map(tile => tile.mask)
    candidate.maxMoves = candidate.required + cushion
    candidate.moves = candidate.maxMoves
    candidate.hints = 2
    candidate.hintsUsed = 0
    candidate.rotations = 0
    candidate.lastSparkUsed = false
    candidate.over = false
    candidate.history = []
    return candidate
  }

  function tracePower(puzzle = state) {
    const powered = new Set()
    if (!puzzle) return {powered, won: false}
    const startIndex = indexOf(puzzle.sourceRow, 0)
    if (!(puzzle.tiles[startIndex].mask & W)) return {powered, won: false}
    const queue = [startIndex]
    powered.add(startIndex)
    while (queue.length) {
      const index = queue.shift()
      const row = Math.floor(index / SIZE), col = index % SIZE
      const mask = puzzle.tiles[index].mask
      for (const dir of DIRS) {
        if (!(mask & dir.bit)) continue
        const nr = row + dir.dr, nc = col + dir.dc
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue
        const next = indexOf(nr, nc)
        if (!(puzzle.tiles[next].mask & dir.opposite) || powered.has(next)) continue
        powered.add(next)
        queue.push(next)
      }
    }
    const targetIndex = indexOf(puzzle.targetRow, SIZE - 1)
    return {powered, won: powered.has(targetIndex) && Boolean(puzzle.tiles[targetIndex].mask & E)}
  }

  function maskLabel(mask) {
    const names = DIRS.filter(dir => mask & dir.bit).map(dir => dir.name)
    return names.length ? `Connects ${names.join(' and ')}` : 'No connections'
  }

  function tileMarkup(mask) {
    return DIRS.filter(dir => mask & dir.bit).map(dir => `<i class="wire ${dir.name[0]}"></i>`).join('')
  }

  function renderBoard() {
    const trace = tracePower()
    const fragment = document.createDocumentFragment()
    state.tiles.forEach((tile, index) => {
      const row = Math.floor(index / SIZE), col = index % SIZE
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `tile${trace.powered.has(index) ? ' powered' : ''}`
      button.dataset.index = String(index)
      button.setAttribute('role', 'gridcell')
      button.setAttribute('aria-rowindex', String(row + 1))
      button.setAttribute('aria-colindex', String(col + 1))
      button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}. ${maskLabel(tile.mask)}. Rotate clockwise.`)
      button.innerHTML = tileMarkup(tile.mask)
      fragment.append(button)
    })
    elements.board.replaceChildren(fragment)
    elements.source.style.setProperty('--source-row', state.sourceRow)
    elements.target.style.setProperty('--target-row', state.targetRow)
    elements.target.classList.toggle('lit', trace.won)
    updateHud()
    return trace.won
  }

  function currentScore(won = false) {
    const base = won ? 1000 : 500
    return Math.max(0, base + state.moves * 55 - state.rotations * 8 - state.hintsUsed * 120 + (state.lastSparkUsed ? 0 : 100))
  }

  function updateHud() {
    elements.moves.textContent = String(state.moves)
    elements.hints.textContent = String(state.hints)
    elements.score.textContent = String(currentScore()).padStart(4, '0')
    elements.energy.style.width = `${Math.max(0, state.moves / state.maxMoves) * 100}%`
    elements.undo.disabled = !state.history.length || state.over
    elements.hint.disabled = state.hints <= 0 || state.over
  }

  function setScreen(name) {
    elements.menu.classList.toggle('active', name === 'menu')
    elements.game.classList.toggle('active', name === 'game')
    elements.home.style.visibility = name === 'menu' ? 'hidden' : 'visible'
  }

  function startGame(mode = 'random', sameSeed = false) {
    closeAllModals()
    const seed = sameSeed && state ? state.seed : mode === 'daily' ? `daily:${todayKey()}` : `random:${Date.now()}:${Math.random()}`
    state = buildPuzzle(seed, mode)
    elements.mode.textContent = mode === 'daily' ? `DAILY CIRCUIT · ${todayKey()}` : 'RANDOM CIRCUIT'
    elements.help.textContent = 'Tap a tile to rotate it clockwise.'
    setScreen('game')
    renderBoard()
    saveActive()
    sound('start')
    requestAnimationFrame(() => elements.board.querySelector('.tile')?.focus({preventScroll: true}))
  }

  function rotateTile(index) {
    if (!state || state.over || state.moves <= 0) return
    state.history.push({index, mask: state.tiles[index].mask, moves: state.moves, rotations: state.rotations, lastSparkUsed: state.lastSparkUsed})
    state.tiles[index].mask = rotateMask(state.tiles[index].mask)
    state.moves--
    state.rotations++
    sound('turn')
    vibrate(10)
    const won = renderBoard()
    const tile = elements.board.querySelector(`[data-index="${index}"]`)
    tile?.focus({preventScroll: true})
    if (won) finish(true)
    else {
      saveActive()
      if (state.moves === 0) {
        if (!state.lastSparkUsed) openModal(elements.lastModal)
        else finish(false)
      }
    }
  }

  function undo() {
    if (!state?.history.length || state.over) return
    const previous = state.history.pop()
    state.tiles[previous.index].mask = previous.mask
    state.moves = previous.moves
    state.rotations = previous.rotations
    state.lastSparkUsed = previous.lastSparkUsed
    renderBoard()
    saveActive()
    elements.help.textContent = 'Last rotation undone.'
    sound('undo')
  }

  function useHint() {
    if (!state || state.hints <= 0 || state.over) return
    const candidates = state.path.map(cell => indexOf(cell[0], cell[1])).filter(index => state.tiles[index].mask !== state.tiles[index].target)
    if (!candidates.length) {
      elements.help.textContent = 'The intended path is aligned—look for a competing connection.'
      return
    }
    const index = candidates[0]
    const tile = elements.board.querySelector(`[data-index="${index}"]`)
    tile?.classList.add('hint')
    tile?.focus({preventScroll: true})
    state.hints--
    state.hintsUsed++
    elements.help.textContent = 'This glowing tile belongs to the intended path.'
    updateHud()
    saveActive()
    sound('hint')
  }

  function takeLastMove() {
    closeModal(elements.lastModal)
    state.lastSparkUsed = true
    state.moves = 1
    elements.help.textContent = 'Last Spark active. One rotation remains.'
    updateHud()
    saveActive()
    sound('spark')
    vibrate([25, 35, 50])
  }

  function finish(won) {
    state.over = true
    saveActive()
    closeAllModals()
    const score = won ? currentScore(true) : 0
    if (won) {
      profile.wins++
      profile.best = Math.max(profile.best, score)
      if (state.mode === 'daily') {
        const today = todayKey()
        if (!profile.dailyScores[today]) {
          profile.dailyStreak = profile.lastDaily === yesterdayKey() ? profile.dailyStreak + 1 : 1
          profile.lastDaily = today
        }
        profile.dailyScores[today] = Math.max(profile.dailyScores[today] || 0, score)
      }
      elements.resultMark.textContent = '✓'
      elements.resultMark.classList.remove('fail')
      elements.resultKicker.textContent = state.mode === 'daily' ? 'Daily circuit complete' : 'Circuit complete'
      elements.resultTitle.textContent = state.lastSparkUsed ? 'Clutched on the last move.' : 'Beautifully connected.'
      elements.resultDetail.textContent = state.moves ? `Solved with ${state.moves} move${state.moves === 1 ? '' : 's'} to spare.` : 'Solved with nothing left in the tank.'
      sound('win')
      vibrate([30, 40, 30, 40, 80])
    } else {
      elements.resultMark.textContent = '×'
      elements.resultMark.classList.add('fail')
      elements.resultKicker.textContent = 'Circuit incomplete'
      elements.resultTitle.textContent = 'Almost connected.'
      elements.resultDetail.textContent = 'Every failed circuit teaches the next one.'
      sound('lose')
    }
    elements.resultScore.textContent = String(score)
    elements.next.querySelector('span').textContent = won ? 'Next puzzle' : 'Try again'
    saveProfile()
    updateStats()
    setTimeout(() => openModal(elements.result), 350)
  }

  function updateStats() {
    elements.wins.textContent = String(profile.wins)
    elements.streak.textContent = String(profile.dailyStreak)
    elements.best.textContent = profile.best ? String(profile.best) : '—'
    elements.sound.setAttribute('aria-pressed', String(profile.muted))
    elements.sound.setAttribute('aria-label', profile.muted ? 'Enable sound' : 'Mute sound')
    elements.sound.textContent = profile.muted ? '∅' : '♪'
    const done = profile.dailyScores[todayKey()]
    elements.dailyStatus.textContent = done ? `✓ ${done}` : 'Play'
    elements.continue.hidden = !loadActive()
  }

  function openModal(modal) {
    modal.hidden = false
    const focusable = modal.querySelector('button')
    setTimeout(() => focusable?.focus(), 0)
  }

  function closeModal(modal) { modal.hidden = true }
  function closeAllModals() { document.querySelectorAll('.modal').forEach(modal => { modal.hidden = true }) }

  function showToast(message) {
    elements.toast.textContent = message
    elements.toast.classList.add('show')
    clearTimeout(showToast.timer)
    showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2200)
  }

  function sound(type) {
    if (profile.muted) return
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)()
      const notes = {turn: [320,.035], undo:[220,.05], hint:[620,.08], spark:[440,.16], start:[260,.08], win:[760,.22], lose:[150,.18]}
      const [frequency, duration] = notes[type] || notes.turn
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain()
      oscillator.type = type === 'win' ? 'sine' : 'triangle'
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      if (type === 'win') oscillator.frequency.exponentialRampToValueAtTime(1120, audioContext.currentTime + duration)
      gain.gain.setValueAtTime(.0001, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(.09, audioContext.currentTime + .01)
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration)
      oscillator.connect(gain).connect(audioContext.destination)
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration)
    } catch (_) {}
  }

  function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern) }

  function shareResult() {
    if (!state) return
    const score = state.over ? elements.resultScore.textContent : currentScore()
    const text = `I scored ${score} in One More Move${state.mode === 'daily' ? ` — Daily Circuit ${todayKey()}` : ''}. Can you connect the current?`
    if (navigator.share) navigator.share({title: 'One More Move', text, url: location.href}).catch(() => {})
    else if (navigator.clipboard) navigator.clipboard.writeText(`${text} ${location.href}`).then(() => showToast('Result copied'))
    else showToast('Sharing is not available here')
  }

  elements.play.addEventListener('click', () => startGame('random'))
  elements.continue.addEventListener('click', () => {
    const saved = loadActive()
    if (!saved) { updateStats(); showToast('No saved circuit found'); return }
    state = saved
    elements.mode.textContent = state.mode === 'daily' ? `DAILY CIRCUIT · ${todayKey()}` : 'RANDOM CIRCUIT'
    elements.help.textContent = 'Circuit restored from this device.'
    setScreen('game')
    renderBoard()
    requestAnimationFrame(() => elements.board.querySelector('.tile')?.focus({preventScroll:true}))
  })
  elements.daily.addEventListener('click', () => startGame('daily'))
  elements.home.addEventListener('click', () => { closeAllModals(); setScreen('menu'); updateStats() })
  elements.sound.addEventListener('click', () => { profile.muted = !profile.muted; saveProfile(); updateStats(); if (!profile.muted) sound('start') })
  elements.undo.addEventListener('click', undo)
  elements.hint.addEventListener('click', useHint)
  elements.restart.addEventListener('click', () => startGame(state?.mode || 'random', true))
  elements.how.addEventListener('click', () => openModal(elements.tutorial))
  elements.reset.addEventListener('click', () => {
    if (!window.confirm('Erase all One More Move progress and settings from this device?')) return
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(ACTIVE_KEY) } catch (_) {}
    profile = defaultProfile()
    state = null
    saveProfile()
    updateStats()
    showToast('Progress reset')
  })
  elements.tutorialPlay.addEventListener('click', () => { profile.tutorialSeen = true; saveProfile(); startGame('random') })
  elements.lastButton.addEventListener('click', takeLastMove)
  elements.giveUp.addEventListener('click', () => finish(false))
  elements.next.addEventListener('click', () => startGame(state?.mode === 'daily' ? 'random' : state?.mode || 'random', !state?.over))
  elements.share.addEventListener('click', shareResult)
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(document.getElementById(button.dataset.close))))

  elements.board.addEventListener('click', event => {
    const tile = event.target.closest('.tile')
    if (tile) rotateTile(Number(tile.dataset.index))
  })
  elements.board.addEventListener('keydown', event => {
    const tile = event.target.closest('.tile')
    if (!tile) return
    const index = Number(tile.dataset.index), row = Math.floor(index / SIZE), col = index % SIZE
    const targets = {ArrowUp: [row - 1, col], ArrowRight: [row, col + 1], ArrowDown: [row + 1, col], ArrowLeft: [row, col - 1]}
    if (!targets[event.key]) return
    event.preventDefault()
    const [nr, nc] = targets[event.key]
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) elements.board.querySelector(`[data-index="${indexOf(nr,nc)}"]`)?.focus()
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAllModals()
    if ((event.key === 'r' || event.key === 'R') && state && elements.game.classList.contains('active')) startGame(state.mode, true)
  })

  if (new URLSearchParams(location.search).has('test')) {
    window.__OMM_TEST__ = Object.freeze({
      buildPuzzle,
      tracePower,
      rotateMask,
      turnsTo,
      snapshot: () => state ? {seed: state.seed, masks: state.tiles.map(tile => tile.mask), moves: state.moves} : null,
      solveCurrent: () => {
        if (!state || state.over) return false
        state.tiles.forEach(tile => { if (tile.path) tile.mask = tile.target })
        const won = renderBoard()
        if (won) finish(true)
        return won
      }
    })
  }

  updateStats()
  setScreen('menu')
  if (!profile.tutorialSeen) setTimeout(() => openModal(elements.tutorial), 450)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {})
})()
