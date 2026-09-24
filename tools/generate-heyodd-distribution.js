const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const [minecraftRoot, outputRoot, packManifestPath, packRoot = minecraftRoot] = process.argv.slice(2)
if(!minecraftRoot || !outputRoot || !packManifestPath) {
    throw new Error('Usage: node tools/generate-heyodd-distribution.js <minecraftRoot> <outputRoot> <packManifest> [packRoot]')
}

const repoRaw = 'https://raw.githubusercontent.com/jp0301/Minecraft-Personal-Server-Launcher/main/distribution'
const neoForgeVersion = '21.1.249'
const versionId = `neoforge-${neoForgeVersion}`
const versionSource = path.join(minecraftRoot, 'versions', versionId, `${versionId}.json`)
const versionOutputDir = path.join(outputRoot, 'neoforge')
const versionOutput = path.join(versionOutputDir, `${versionId}.json`)
const instanceRoot = path.join(outputRoot, 'instance')

const md5 = file => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')
const artifact = (file, url, relativePath) => ({
    size: fs.statSync(file).size,
    MD5: md5(file),
    url,
    ...(relativePath ? { path: relativePath.replaceAll('\\', '/') } : {})
})
const githubTextExtensions = new Set(['.cfg', '.conf', '.ini', '.json', '.json5', '.properties', '.toml', '.txt', '.xml', '.yaml', '.yml'])
const githubHostedArtifact = (file, url, relativePath) => {
    const localContent = fs.readFileSync(file)
    const hostedContent = githubTextExtensions.has(path.extname(file).toLowerCase())
        ? Buffer.from(localContent.toString('utf8').replaceAll('\r\n', '\n'))
        : localContent
    return {
        size: hostedContent.length,
        MD5: crypto.createHash('md5').update(hostedContent).digest('hex'),
        url,
        path: relativePath.replaceAll('\\', '/')
    }
}

const versionManifest = JSON.parse(fs.readFileSync(versionSource, 'utf8'))
fs.mkdirSync(versionOutputDir, { recursive: true })
fs.writeFileSync(versionOutput, `${JSON.stringify(versionManifest, null, 2)}\n`)

const neoForgeLibraryRoot = path.join(minecraftRoot, 'libraries', 'net', 'neoforged', 'neoforge', neoForgeVersion)
const clientJar = path.join(minecraftRoot, 'versions', versionId, `${versionId}.jar`)
const universalJar = path.join(neoForgeLibraryRoot, `neoforge-${neoForgeVersion}-universal.jar`)
const neoForgeMaven = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoForgeVersion}`
const neoForgeInstallerUrl = `${neoForgeMaven}/neoforge-${neoForgeVersion}-installer.jar`

const libraryModules = versionManifest.libraries.map(lib => {
    const download = lib.downloads?.artifact
    if(!download?.path || !download?.url) {
        throw new Error(`NeoForge library has no downloadable artifact: ${lib.name}`)
    }
    const localFile = path.join(minecraftRoot, 'libraries', ...download.path.split('/'))
    if(!fs.existsSync(localFile)) {
        throw new Error(`Installed NeoForge library is missing: ${localFile}`)
    }
    return {
        id: lib.name,
        name: lib.name,
        type: 'Library',
        artifact: artifact(localFile, download.url)
    }
})

const packManifest = JSON.parse(fs.readFileSync(packManifestPath, 'utf8'))
const packModules = packManifest.files.map(file => {
    const localFile = path.join(packRoot, ...file.path.split('/'))
    if(!fs.existsSync(localFile)) {
        throw new Error(`Pack file is missing: ${localFile}`)
    }
    return {
        id: `heyodd-${file.path.replaceAll('/', '-').replaceAll(':', '-')}`,
        name: path.basename(file.path),
        type: 'File',
        artifact: artifact(localFile, file.url, file.path)
    }
})

const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
})

const instanceModules = fs.existsSync(instanceRoot) ? walk(instanceRoot).map(file => {
    const relative = path.relative(instanceRoot, file).replaceAll('\\', '/')
    return {
        id: `heyodd-config-${relative.replaceAll('/', '-').replaceAll(':', '-')}`,
        name: relative,
        type: 'File',
        // GitHub raw serves repository text with LF line endings, even from a
        // Windows checkout configured to materialize those files as CRLF.
        artifact: githubHostedArtifact(file, `${repoRaw}/instance/${relative.split('/').map(encodeURIComponent).join('/')}`, relative)
    }
}) : []

const versionArtifact = artifact(versionOutput, `${repoRaw}/neoforge/${versionId}.json`)
const distribution = {
    version: '0.2.21',
    rss: '',
    servers: [{
        id: 'heyodd-1.21.1',
        name: '영무예다음',
        description: '충북혁신도시 영무예다음 친구들을 위한 Vanilla+ Minecraft 서버',
        icon: `${repoRaw}/server-icon.png`,
        version: '0.2.21',
        cleanupFiles: [
            'mods/fabric-api-0.116.17+1.21.1.jar',
            'mods/armor-hider-neoforge-0.13.4+mc-1.21.0-1.jar',
            'mods/carryon-neoforge-1.21.1-2.2.6.13.jar',
            'mods/fantasyfurniture-21.10.5.jar',
            'mods/fairylights-neoforge-1.21.1-1.2.3.jar'
        ],
        address: 'heyodd.iptime.org',
        minecraftVersion: '1.21.1',
        javaOptions: {
            supported: '21.x',
            suggestedMajor: 21,
            distribution: 'TEMURIN',
            ram: { recommended: 6144, minimum: 4096 }
        },
        mainServer: true,
        autoconnect: true,
        modules: [{
            id: `net.neoforged:neoforge:${neoForgeVersion}:client`,
            name: `NeoForge ${neoForgeVersion}`,
            type: 'ForgeHosted',
            // The official launcher exposes the inherited Minecraft client under this
            // NeoForge version path. The local installer helper mirrors that behavior.
            artifact: artifact(clientJar, neoForgeInstallerUrl, `../versions/${versionId}/${versionId}.jar`),
            subModules: [{
                id: `net.neoforged:neoforge:${neoForgeVersion}:universal`,
                name: 'NeoForge universal',
                type: 'Library',
                classpath: false,
                artifact: artifact(universalJar, `${neoForgeMaven}/neoforge-${neoForgeVersion}-universal.jar`)
            }, {
                id: versionId,
                name: 'NeoForge version manifest',
                type: 'VersionManifest',
                artifact: versionArtifact
            }, ...libraryModules]
        }, ...packModules, ...instanceModules]
    }]
}

fs.writeFileSync(path.join(outputRoot, 'distribution.json'), `${JSON.stringify(distribution, null, 2)}\n`)
console.log(`Generated ${distribution.servers[0].modules.length} top-level modules and ${libraryModules.length} NeoForge libraries.`)
