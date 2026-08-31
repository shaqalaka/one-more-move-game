import {mkdir, rm, copyFile, readFile, writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dist = resolve(root, 'dist')
const shared = [
  'index.html','privacy.html','styles.css','game.js','manifest.webmanifest','icon.svg',
  'icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png'
]
const testApiPattern = /\n\s*\/\* TEST_API_START \*\/[\s\S]*?\/\* TEST_API_END \*\/\n/
const registration = "if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {})"

await rm(dist,{recursive:true,force:true})
for (const target of ['pwa','native']) {
  await mkdir(resolve(dist,target),{recursive:true})
  for (const file of shared) await copyFile(resolve(root,file),resolve(dist,target,file))
}

const sourceGame = await readFile(resolve(root,'game.js'),'utf8')
if (!testApiPattern.test(sourceGame)) throw new Error('Could not locate test-only API boundary')
const productionGame = sourceGame.replace(testApiPattern,'\n')
if (!productionGame.includes(registration)) throw new Error('Could not locate service-worker registration boundary')
await writeFile(resolve(dist,'pwa/game.js'),productionGame)
await writeFile(resolve(dist,'native/game.js'),productionGame.replace(registration,'// Native bundle deliberately omits service-worker registration.'))

const revision = createHash('sha256')
for (const file of shared) revision.update(await readFile(resolve(root,file)))
const releaseId = revision.digest('hex').slice(0,12)
const worker = (await readFile(resolve(root,'sw.js'),'utf8')).replace('__CACHE_VERSION__',releaseId)
await writeFile(resolve(dist,'pwa/sw.js'),worker)
console.log(`Built dist/pwa and dist/native (release ${releaseId}).`)
