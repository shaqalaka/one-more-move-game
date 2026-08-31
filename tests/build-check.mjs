import {readFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const text = file => readFile(resolve(root,file),'utf8')
const shared = ['index.html','privacy.html','styles.css','manifest.webmanifest','icon.svg']
const failures = []
for (const file of shared) {
  const [source,pwa,native,android] = await Promise.all([
    text(file),text(`dist/pwa/${file}`),text(`dist/native/${file}`),text(`android/app/src/main/assets/public/${file}`)
  ])
  if (source !== pwa) failures.push(`PWA ${file} differs from source`)
  if (source !== native) failures.push(`Native ${file} differs from source`)
  if (native !== android) failures.push(`Android ${file} differs from native build`)
}
const [sourceGame,pwaGame,nativeGame,androidGame] = await Promise.all([
  text('game.js'),text('dist/pwa/game.js'),text('dist/native/game.js'),text('android/app/src/main/assets/public/game.js')
])
if (sourceGame !== pwaGame) failures.push('PWA game.js differs from source')
if (!pwaGame.includes('serviceWorker.register')) failures.push('PWA build lacks service worker registration')
if (nativeGame.includes('serviceWorker.register')) failures.push('Native build must omit service worker registration')
if (nativeGame !== androidGame) failures.push('Android game.js differs from native build')
const gradle = await text('android/app/build.gradle')
const config = JSON.parse(await text('capacitor.config.json'))
if (!gradle.includes(`applicationId "${config.appId}"`)) failures.push('Android applicationId differs from Capacitor appId')
if (failures.length) { console.error(failures.join('\n')); process.exit(1) }
console.log('Build checks passed: source, PWA, native, and Android assets are synchronized.')
