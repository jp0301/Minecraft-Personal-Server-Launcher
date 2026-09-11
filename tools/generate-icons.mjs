import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(projectRoot, 'design', 'heyodd-launcher-icon-concept-v1.png')
const pngTargets = [
    path.join(projectRoot, 'app', 'assets', 'images', 'Icon.png'),
    path.join(projectRoot, 'build', 'icon.png')
]
const icoTargets = [
    path.join(projectRoot, 'app', 'assets', 'images', 'Icon.ico'),
    path.join(projectRoot, 'build', 'icon.ico')
]

for(const target of pngTargets) {
    await fs.copyFile(source, target)
}

const ico = await pngToIco(source)
for(const target of icoTargets) {
    await fs.writeFile(target, ico)
}

console.log(`Generated launcher icons from ${source}`)
