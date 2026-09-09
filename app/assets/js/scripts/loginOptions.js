const loginOptionsCancelContainer = document.getElementById('loginOptionCancelContainer')
const loginOptionMicrosoft = document.getElementById('loginOptionMicrosoft')
const loginOptionMojang = document.getElementById('loginOptionMojang')
const installWithoutLogin = document.getElementById('installWithoutLogin')
const loginOptionsCancelButton = document.getElementById('loginOptionCancelButton')

let loginOptionsCancellable = false

let loginOptionsViewOnLoginSuccess
let loginOptionsViewOnLoginCancel
let loginOptionsViewOnCancel
let loginOptionsViewCancelHandler

function loginOptionsCancelEnabled(val){
    if(val){
        $(loginOptionsCancelContainer).show()
    } else {
        $(loginOptionsCancelContainer).hide()
    }
}

loginOptionMicrosoft.onclick = (e) => {
    switchView(getCurrentView(), VIEWS.waiting, 500, 500, () => {
        ipcRenderer.send(
            MSFT_OPCODE.OPEN_LOGIN,
            loginOptionsViewOnLoginSuccess,
            loginOptionsViewOnLoginCancel
        )
    })
}

loginOptionMojang.onclick = (e) => {
    switchView(getCurrentView(), VIEWS.login, 500, 500, () => {
        loginViewOnSuccess = loginOptionsViewOnLoginSuccess
        loginViewOnCancel = loginOptionsViewOnLoginCancel
        loginCancelEnabled(true)
    })
}

loginOptionsCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginOptionsViewOnCancel, 500, 500, () => {
        // Clear login values (Mojang login)
        // No cleanup needed for Microsoft.
        loginUsername.value = ''
        loginPassword.value = ''
        if(loginOptionsViewCancelHandler != null){
            loginOptionsViewCancelHandler()
            loginOptionsViewCancelHandler = null
        }
    })
}

installWithoutLogin.onclick = async () => {
    switchView(getCurrentView(), VIEWS.landing, 500, 500, async () => {
        try {
            const distro = await DistroAPI.refreshDistributionOrFallback()
            const server = distro.getServerById(ConfigManager.getSelectedServer()) || distro.getMainServer()
            ConfigManager.setSelectedServer(server.rawServer.id)
            ConfigManager.save()

            const jExe = ConfigManager.getJavaExecutable(server.rawServer.id)
            if(jExe == null) {
                await asyncSystemScan(server.effectiveJavaOptions, false)
                return
            }

            const details = await validateSelectedJvm(ensureJavaDirIsRoot(jExe), server.effectiveJavaOptions.supported)
            if(details == null) {
                await asyncSystemScan(server.effectiveJavaOptions, false)
                return
            }

            await dlAsync(false)
        } catch(err) {
            loggerLanding.error('Unable to install game files without login.', err)
            showLaunchFailure(
                Lang.queryJS('landing.dlAsync.installFailureTitle'),
                err.message || Lang.queryJS('landing.dlAsync.seeConsoleForDetails')
            )
        }
    })
}
