import {readFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const text = file => readFile(resolve(root,file),'utf8')
const shared = ['index.html','privacy.html','styles.css','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png']
const failures = []
for (const file of shared) {
  const [source,pwa,native,android] = await Promise.all([
    text(file),text(`dist/pwa/${file}`),text(`dist/native/${file}`),text(`android/app/src/main/assets/public/${file}`)
  ])
  if (source !== pwa) failures.push(`PWA ${file} differs from source`)
  if (source !== native) failures.push(`Native ${file} differs from source`)
  if (native !== android) failures.push(`Android ${file} differs from native build`)
}
const [sourceGame,pwaGame,nativeGame,androidGame,pwaWorker] = await Promise.all([
  text('game.js'),text('dist/pwa/game.js'),text('dist/native/game.js'),text('android/app/src/main/assets/public/game.js'),text('dist/pwa/sw.js')
])
const productionGame = sourceGame.replace(/\n\s*\/\* TEST_API_START \*\/[\s\S]*?\/\* TEST_API_END \*\/\n/,'\n')
if (pwaGame !== productionGame) failures.push('PWA game.js is not the test-API-free production source')
if (pwaGame.includes('__OMM_TEST__')) failures.push('PWA exposes test helper')
if (!pwaGame.includes('serviceWorker.register')) failures.push('PWA build lacks service worker registration')
if (nativeGame.includes('serviceWorker.register')) failures.push('Native build must omit service worker registration')
if (nativeGame !== androidGame) failures.push('Android game.js differs from native build')
if (pwaWorker.includes('__CACHE_VERSION__')) failures.push('PWA worker cache version was not generated')
if (!pwaWorker.includes("response.ok")) failures.push('PWA worker must restrict runtime caching to successful responses')
const [gradle,manifest,colors] = await Promise.all([text('android/app/build.gradle'),text('android/app/src/main/AndroidManifest.xml'),text('android/app/src/main/res/values/colors.xml')])
const config = JSON.parse(await text('capacitor.config.json'))
if (!gradle.includes(`applicationId "${config.appId}"`)) failures.push('Android applicationId differs from Capacitor appId')
if (!gradle.includes('versionName "0.1.0"')) failures.push('Android versionName differs from product version')
if (!manifest.includes('android.permission.VIBRATE')) failures.push('Android haptics permission is missing')
if (!manifest.includes('android:screenOrientation="portrait"')) failures.push('Android portrait contract is missing')
for (const name of ['colorPrimary','colorPrimaryDark','colorAccent']) if (!colors.includes(`name="${name}"`)) failures.push(`Android color resource missing: ${name}`)
if (failures.length) { console.error(failures.join('\n')); process.exit(1) }
console.log('Build checks passed: production PWA, native bundle, and Android project are synchronized and hardened.')
