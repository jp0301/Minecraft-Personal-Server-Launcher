const path = require('path')

module.exports = async context => {
    if(context.electronPlatformName !== 'win32') return

    const { rcedit } = await import('rcedit')
    const executable = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`)
    const icon = path.join(context.packager.projectDir, 'build', 'icon.ico')
    await rcedit(executable, { icon })
}
