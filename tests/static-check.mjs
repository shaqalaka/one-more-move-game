import {readFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const names = ['index.html','privacy.html','styles.css','game.js','manifest.webmanifest','sw.js','icon.svg','icon-maskable.svg']
const files = Object.fromEntries(await Promise.all(names.map(async name => [name, await readFile(resolve(root,name),'utf8')])))
const failures = []
for (const [name, text] of Object.entries(files)) if (!text.trim()) failures.push(`${name} is empty`)
for (const asset of ['styles.css','game.js','manifest.webmanifest','icon.svg']) if (!files['index.html'].includes(asset)) failures.push(`index.html does not reference ${asset}`)
for (const asset of ['./index.html','./privacy.html','./styles.css','./game.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png']) if (!files['sw.js'].includes(asset)) failures.push(`service worker does not cache ${asset}`)
const ids = [...files['index.html'].matchAll(/\sid="([^"]+)"/g)].map(match => match[1])
const duplicates = ids.filter((id,index) => ids.indexOf(id) !== index)
if (duplicates.length) failures.push(`Duplicate ids: ${[...new Set(duplicates)].join(', ')}`)
if (files['game.js'].includes('eval(') || files['game.js'].includes('new Function')) failures.push('Dynamic code execution is forbidden')
if (/fetch\(\s*['"]https?:\/\//.test(files['game.js'])) failures.push('Game runtime must not fetch remote endpoints')
if (!files['game.js'].includes('daily:')) failures.push('Daily challenge seed is missing')
if (!files['game.js'].includes('localStorage')) failures.push('Local progress persistence is missing')
if (!files['index.html'].includes('No account · No ads')) failures.push('Offline/no-ads disclosure is missing')
if (files['index.html'].includes('user-scalable=no')) failures.push('Viewport must allow user zoom')
if (!files['manifest.webmanifest'].includes('icon-maskable-512.png')) failures.push('Manifest lacks dedicated maskable icon')
if (!files['sw.js'].includes('__CACHE_VERSION__')) failures.push('Service worker lacks generated revision token')
if (failures.length) { console.error(failures.join('\n')); process.exit(1) }
console.log(`Static checks passed for ${names.length} game assets.`)
