using CmlLib.Core.Auth;
using CmlLib.Core.Auth.Microsoft;
using CmlLib.Core.Auth.Microsoft.Sessions;
using XboxAuthNet.Game.Accounts;
using XboxAuthNet.Game.Msal;

namespace HeyOddLauncher.Services;

public sealed class MicrosoftMinecraftAuth(string clientId)
{
    public async Task<MSession> SignInAsync(bool interactive)
    {
        if (string.IsNullOrWhiteSpace(clientId) || clientId.StartsWith("REPLACE_", StringComparison.Ordinal))
            throw new InvalidOperationException("Microsoft Entra 앱의 Client ID를 launcher-settings.json에 설정해 주세요.");

        var app = await MsalClientHelper.BuildApplicationWithCache(clientId);
        // Xbox/Minecraft access tokens live only for this process. MSAL's Windows
        // protected cache retains the Microsoft refresh capability; no password is handled.
        var handler = new JELoginHandlerBuilder()
            .WithAccountManager(new InMemoryXboxGameAccountManager(JEGameAccount.FromSessionStorage))
            .Build();
        var authenticator = interactive
            ? handler.CreateAuthenticatorWithNewAccount()
            : handler.CreateAuthenticatorWithDefaultAccount();
        authenticator.AddMsalOAuth(app, msal => interactive ? msal.SystemBrowser() : msal.Silent());
        authenticator.AddXboxAuthForJE(xbox => xbox.Basic());
        authenticator.AddJEAuthenticator();
        return await authenticator.ExecuteForLauncherAsync();
    }
}
