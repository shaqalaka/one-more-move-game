import {createServer} from 'node:http'
import {readFile, stat} from 'node:fs/promises'
import {resolve, dirname, extname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/pwa')
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/manifest+json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'}
const server = createServer(async (request,response) => {
  try {
    const pathname = new URL(request.url,'http://localhost').pathname
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//,'')
    const file = resolve(root,relative)
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('not found')
    response.writeHead(200,{'content-type':types[extname(file)] || 'application/octet-stream','cache-control':'no-store'})
    response.end(await readFile(file))
  } catch (_) {
    response.writeHead(404,{'content-type':'text/plain'}).end('Not found')
  }
})
await new Promise(resolveListen => server.listen(0,'127.0.0.1',resolveListen))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({headless:true})
const context = await browser.newContext()
const page = await context.newPage()
const assert = (condition,message) => { if (!condition) throw new Error(message) }

try {
  await page.goto(origin,{waitUntil:'networkidle'})
  await page.reload({waitUntil:'networkidle'})
  await page.waitForFunction(() => navigator.serviceWorker.controller)
  assert(await page.evaluate(() => typeof window.__OMM_TEST__) === 'undefined','Production PWA must not expose its test API')
  const keys = await page.evaluate(() => caches.keys())
  assert(keys.some(key => /^one-more-move-[a-f0-9]{12}$/.test(key)),'PWA cache must have a generated revision')

  await page.goto(`${origin}/privacy.html`,{waitUntil:'networkidle'})
  assert((await page.locator('body').innerText()).includes('privacy notice'),'Privacy route must load online')
  await context.setOffline(true)
  await page.goto(`${origin}/`,{waitUntil:'domcontentloaded'})
  assert(await page.locator('#game-title').count() === 1,'Offline root must remain the game after visiting Privacy')
  assert(await page.locator('.legal-card').count() === 0,'Privacy navigation must not overwrite the offline app shell')
  console.log('PWA smoke passed: revisioned worker, production API stripping, route-safe caching, and offline shell.')
} finally {
  await context.setOffline(false).catch(() => {})
  await browser.close()
  await new Promise(resolveClose => server.close(resolveClose))
}
