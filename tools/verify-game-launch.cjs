// Runs the production argument builder with the saved account, without printing credentials.
const fs = require('fs-extra')
const path = require('path')
const vm = require('vm')
const assert = require('assert/strict')
const { createRequire } = require('module')
const { spawn } = require('child_process')
const { HeliosDistribution } = require('helios-core/common')
const root = path.resolve(__dirname, '..')
const data = path.join(process.env.APPDATA, '.heyoddlauncher')
const config = fs.readJsonSync(path.join(process.env.APPDATA, '영무예다음 Minecraft Launcher', 'config.json'))
const server = new HeliosDistribution(fs.readJsonSync(path.join(root, 'distribution/distribution.json')), path.join(data, 'common'), path.join(data, 'instances')).getMainServer()
const savedAccount = config.selectedAccount?.accessToken
    ? config.selectedAccount
    : Object.values(config.authenticationDatabase ?? {}).find(candidate => candidate?.accessToken)
const account = savedAccount ?? {
    displayName: 'LaunchVerifier',
    uuid: '00000000000000000000000000000000',
    accessToken: 'offline-verification-token',
    type: 'microsoft'
}
console.log(savedAccount ? 'Using a saved Minecraft session.' : 'No saved session found; using a local launch-only identity.')
const settings = {
    getInstanceDirectory: () => path.join(data, 'instances'),
    getCommonDirectory: () => path.join(data, 'common'),
    getMaxRAM: () => '6G', getMinRAM: () => '2G', getJVMOptions: () => [],
    getFullscreen: () => false, getGameWidth: () => 960, getGameHeight: () => 600,
    getAutoConnect: () => false
}
const filename = path.join(root, 'app/assets/js/processbuilder.js')
const localRequire = createRequire(filename)
const sandbox = { require: name => name === './configmanager' ? settings : localRequire(name), module: { exports: {} }, console, process, __dirname: path.dirname(filename), structuredClone }
vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename })
const Builder = sandbox.module.exports
const vanilla = fs.readJsonSync(path.join(data, 'common/versions/1.21.1/1.21.1.json'))
const manifest = fs.readJsonSync(path.join(root, 'distribution/neoforge/neoforge-21.1.249.json'))
const builder = new Builder(server, vanilla, manifest, account, 'verification')
const natives = fs.mkdtempSync(path.join(require('os').tmpdir(), 'heyodd-verify-'))
const original = JSON.stringify(vanilla)
const args = builder.constructJVMArguments([], natives)
assert.equal(JSON.stringify(vanilla), original, 'Argument construction mutated the manifest')
assert.equal(JSON.stringify(builder.constructJVMArguments([], natives)), JSON.stringify(args), 'Repeated launch changed arguments')
const cp = args[args.indexOf('-cp') + 1].split(path.delimiter)
assert(!cp.some(p => p.endsWith('-universal.jar')), 'NeoForge universal must be discovered by FML, not the JVM')
assert(!cp.some(p => p.endsWith('neoforge-21.1.249-client.jar')), 'Patched Minecraft must be discovered by FML')
console.log('PASS: production classpath and repeat-launch invariants')
const child = spawn('C:/Program Files/Java/jdk-21/bin/java.exe', args, { cwd: builder.gameDir, windowsHide: true })
let booted = false
let timedOut = false
const privateValues = [account.accessToken, account.refreshToken, account.uuid, account.username, account.displayName]
    .filter(Boolean)
const redact = value => privateValues.reduce((text, secret) => text.split(secret).join('[REDACTED]'), String(value))
for(const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
    const output = redact(chunk)
    for(const line of output.split('\n')) {
        if(/Found mod file "neoforge|ERROR|Exception|Caused by|OpenAL|Sound engine|Reloading ResourceManager/.test(line)) {
            console.log(line)
        }
        if(!booted && /Sound engine started/.test(line)) {
            booted = true
            console.log('PASS: Minecraft reached the main-menu resource initialization stage')
            setTimeout(() => child.kill(), 3000)
        }
    }
})
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('close', code => {
    clearTimeout(timer)
    if(booted && !timedOut) {
        console.log('PASS: verification game process closed after successful startup')
    } else {
        console.error(`FAIL: game exited before verification completed (exit code ${code})`)
        process.exitCode = 1
    }
})
const timer = setTimeout(() => {
    timedOut = true
    console.error('FAIL: Minecraft did not reach the main-menu resource initialization stage within 60 seconds')
    child.kill()
}, 60000)
