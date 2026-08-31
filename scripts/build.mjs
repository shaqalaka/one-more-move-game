import {mkdir, rm, copyFile, readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const dist = resolve(root, 'dist')
const shared = ['index.html','privacy.html','styles.css','game.js','manifest.webmanifest','icon.svg']
await rm(dist,{recursive:true,force:true})
for (const target of ['pwa','native']) {
  await mkdir(resolve(dist,target),{recursive:true})
  for (const file of shared) await copyFile(resolve(root,file),resolve(dist,target,file))
}
await copyFile(resolve(root,'sw.js'),resolve(dist,'pwa/sw.js'))

const nativeGamePath = resolve(dist,'native/game.js')
const nativeGame = await readFile(nativeGamePath,'utf8')
const registration = "if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {})"
if (!nativeGame.includes(registration)) throw new Error('Native build could not locate service-worker registration boundary')
await writeFile(nativeGamePath,nativeGame.replace(registration,"// Native bundle deliberately omits service-worker registration."))
console.log('Built dist/pwa and dist/native from canonical source.')
