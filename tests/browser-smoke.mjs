import {chromium} from 'playwright'
import {pathToFileURL} from 'node:url'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = `${pathToFileURL(resolve(root,'index.html')).href}?test=1`
const browser = await chromium.launch({headless:true})
const page = await browser.newPage({viewport:{width:390,height:844}, reducedMotion:'reduce'})
const remoteRequests = []
page.on('request', request => { if (!request.url().startsWith('file:')) remoteRequests.push(request.url()) })
const assert = (condition,message) => { if (!condition) throw new Error(message) }

try {
  await page.goto(url)
  await page.waitForSelector('#tutorial-modal:not([hidden])')
  await page.getByRole('button',{name:/Start playing/}).click()
  await page.waitForSelector('#game-screen.active')
  assert(await page.locator('.tile').count() === 25,'Board must render 25 tiles')

  const generation = await page.evaluate(() => {
    const api = window.__OMM_TEST__
    const failures = []
    for (let i=0;i<250;i++) {
      const puzzle = api.buildPuzzle(`test:${i}`,'random')
      if (puzzle.required > puzzle.maxMoves) failures.push(`budget:${i}`)
      if (api.tracePower(puzzle).won) failures.push(`initial-win:${i}`)
      puzzle.tiles.forEach(tile => { if (tile.path) tile.mask = tile.target })
      if (!api.tracePower(puzzle).won) failures.push(`canonical-fail:${i}`)
    }
    return failures
  })
  assert(generation.length === 0,`Generator invariants failed: ${generation.slice(0,5).join(',')}`)

  const first = page.locator('.tile').first()
  const movesBefore = Number(await page.locator('#moves').textContent())
  await first.click()
  assert(Number(await page.locator('#moves').textContent()) === movesBefore-1,'Rotation must consume one move')
  assert(!(await page.locator('#undo-button').isDisabled()),'Undo must enable after a rotation')
  await page.locator('#home-button').click()
  assert(await page.locator('#continue-button').isVisible(),'Unfinished circuit must offer Continue')
  await page.locator('#continue-button').click()
  assert(Number(await page.locator('#moves').textContent()) === movesBefore-1,'Continue must restore move state')
  await page.locator('#undo-button').click()
  assert(Number(await page.locator('#moves').textContent()) === movesBefore,'Undo must refund the move')

  const hintsBefore = Number(await page.locator('#hints').textContent())
  await page.locator('#hint-button').click()
  assert(Number(await page.locator('#hints').textContent()) === hintsBefore-1,'Hint must consume one hint')
  assert(await page.locator('.tile.hint').count() === 1,'Hint must identify an intended-path tile')

  const sparkIndexes = await page.evaluate(() => window.__OMM_TEST__.prepareLastSpark())
  await page.locator(`.tile[data-index="${sparkIndexes[0]}"]`).click()
  await page.waitForSelector('#last-move-modal:not([hidden])')
  await page.locator('#last-move-button').click()
  assert(Number(await page.locator('#moves').textContent()) === 1,'Last Spark must grant exactly one move')
  await page.locator(`.tile[data-index="${sparkIndexes[1]}"]`).click()
  await page.waitForSelector('#result-modal:not([hidden])')
  assert((await page.locator('#result-title').textContent()).includes('last move'),'Last Spark solution must receive clutch result')
  assert(Number(await page.locator('#result-score').textContent()) > 0,'Win must award a score')

  await page.keyboard.press('Escape')
  await page.locator('#home-button').click()
  await page.locator('#daily-button').click()
  const dailyA = await page.evaluate(() => window.__OMM_TEST__.snapshot())
  await page.locator('#restart-button').click()
  const dailyB = await page.evaluate(() => window.__OMM_TEST__.snapshot())
  assert(JSON.stringify(dailyA) === JSON.stringify(dailyB),'Daily puzzle must restart deterministically')

  assert(remoteRequests.length === 0,`Game made unexpected remote requests: ${remoteRequests.join(', ')}`)
  assert(await page.locator('body').evaluate(el => el.scrollWidth <= el.clientWidth),'Mobile layout must not scroll horizontally')
  console.log('Browser smoke passed: generation, gameplay, undo, hints, win, daily determinism, offline and mobile layout.')
} finally {
  await browser.close()
}
