const childProcess = require('child_process')
const path = require('path')
const fs = require('fs-extra')

const { validateLocalFile } = require('helios-core/common')
const { HashAlgo, MojangIndexProcessor, downloadFile, downloadQueue, getExpectedDownloadSize } = require('helios-core/dl')

const NEOFORGE_VERSION = '21.1.249'
const INSTALLER_SHA1 = 'd94d4445a3dda42e7dd54f5c7f789aa78c822074'
const INSTALLER_URL = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${NEOFORGE_VERSION}/neoforge-${NEOFORGE_VERSION}-installer.jar`

function neoForgeClientPath(commonDir) {
    const versionId = `neoforge-${NEOFORGE_VERSION}`
    return path.join(commonDir, 'versions', versionId, `${versionId}.jar`)
}

function minecraftClientPath(commonDir, minecraftVersion) {
    return path.join(commonDir, 'versions', minecraftVersion, `${minecraftVersion}.jar`)
}

async function downloadMinecraftBase(commonDir, minecraftVersion, onProgress) {
    const processor = new MojangIndexProcessor(commonDir, minecraftVersion)
    await processor.init()
    const groups = await processor.validate(() => {})
    const assets = Object.values(groups).flat()
    if(assets.length === 0) return

    const total = getExpectedDownloadSize(assets)
    await downloadQueue(assets, received => onProgress(total > 0 ? Math.trunc((received / total) * 100) : 100))
    await processor.postDownload()
}

async function runInstaller(javaExecutable, installerPath, commonDir, logger) {
    const java = path.basename(javaExecutable).toLowerCase() === 'javaw.exe'
        ? path.join(path.dirname(javaExecutable), 'java.exe')
        : javaExecutable

    await new Promise((resolve, reject) => {
        const proc = childProcess.spawn(java, ['-jar', installerPath, '--install-client', commonDir], {
            cwd: path.dirname(installerPath),
            windowsHide: true
        })
        proc.stdout.on('data', data => logger.info(`[NeoForge Installer] ${`${data}`.trim()}`))
        proc.stderr.on('data', data => logger.warn(`[NeoForge Installer] ${`${data}`.trim()}`))
        proc.once('error', reject)
        proc.once('close', code => code === 0 ? resolve() : reject(new Error(`NeoForge installer exited with code ${code}.`)))
    })
}

async function ensureNeoForgeClient({ commonDir, minecraftVersion, javaExecutable, expectedMD5, onProgress, onStatus, logger }) {
    const clientPath = neoForgeClientPath(commonDir)
    if(await validateLocalFile(clientPath, HashAlgo.MD5, expectedMD5)) return false

    onStatus('minecraft')
    await downloadMinecraftBase(commonDir, minecraftVersion, onProgress)

    // The official installer requires this vanilla-launcher marker. Helios itself does not use it.
    const profilesPath = path.join(commonDir, 'launcher_profiles.json')
    if(!await fs.pathExists(profilesPath)) {
        await fs.writeJson(profilesPath, { profiles: {}, settings: {} })
    }

    const installerPath = path.join(commonDir, 'installers', `neoforge-${NEOFORGE_VERSION}-installer.jar`)
    if(!await validateLocalFile(installerPath, HashAlgo.SHA1, INSTALLER_SHA1)) {
        await fs.ensureDir(path.dirname(installerPath))
        onStatus('installer')
        await downloadFile(INSTALLER_URL, installerPath, ({ transferred, total }) => {
            onProgress(total > 0 ? Math.trunc((transferred / total) * 100) : 0)
        })
    }

    onStatus('installing')
    onProgress(0)
    await runInstaller(javaExecutable, installerPath, commonDir, logger)

    // Mojang's launcher supplies the inherited Minecraft client JAR under the
    // NeoForge version name. Helios expects the ForgeHosted module to provide
    // that same classpath entry, so mirror the already validated base client.
    await fs.ensureDir(path.dirname(clientPath))
    await fs.copy(minecraftClientPath(commonDir, minecraftVersion), clientPath, { overwrite: true })

    if(!await validateLocalFile(clientPath, HashAlgo.MD5, expectedMD5)) {
        throw new Error('NeoForge client installation completed, but the generated file failed validation.')
    }
    onProgress(100)
    return true
}

module.exports = { ensureNeoForgeClient, neoForgeClientPath }
